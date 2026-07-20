import Campaign from '../models/Campaign.js';
import Product from '../models/Product.js';
import { clearCache } from '../middlewares/cache.js';

class CampaignService {
  /**
   * Kích hoạt & áp dụng chiến dịch giảm giá lên danh sách sản phẩm theo phạm vi
   * @param {string} campaignId 
   */
  async applyCampaign(campaignId) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Không tìm thấy chiến dịch khuyến mãi');
    }

    if (campaign.status === 'active') {
      throw new Error('Chiến dịch này đang được áp dụng rồi!');
    }

    // Kiểm tra và lấy danh sách sản phẩm thuộc phạm vi
    let filter = { isActive: true };
    if (campaign.targetType === 'by_categories') {
      if (!campaign.targetCategories || campaign.targetCategories.length === 0) {
        throw new Error('Chưa chọn danh mục nào cho chiến dịch');
      }
      filter.categoryId = { $in: campaign.targetCategories };
    } else if (campaign.targetType === 'by_products') {
      if (!campaign.targetProducts || campaign.targetProducts.length === 0) {
        throw new Error('Chưa chọn sản phẩm cụ thể nào cho chiến dịch');
      }
      filter._id = { $in: campaign.targetProducts };
    }

    const products = await Product.find(filter);
    if (products.length === 0) {
      throw new Error('Không tìm thấy sản phẩm nào đang hoạt động trong phạm vi được chọn');
    }

    const snapshot = [];
    const bulkOps = [];

    for (const p of products) {
      // Lưu lại giá trị ban đầu vào snapshot
      snapshot.push({
        productId: p._id,
        originalPrice: p.price,
        originalDiscountPrice: p.discountPrice || null
      });

      // Tính giá mới theo loại giảm giá
      let newPrice = p.price;
      if (campaign.discountType === 'percent') {
        let discountAmt = (p.price * campaign.discountValue) / 100;
        if (campaign.maxDiscountAmount && discountAmt > campaign.maxDiscountAmount) {
          discountAmt = campaign.maxDiscountAmount;
        }
        newPrice = Number((p.price - discountAmt).toFixed(2));
      } else if (campaign.discountType === 'fixed') {
        newPrice = Number(Math.max(0, p.price - campaign.discountValue).toFixed(2));
      }

      // Nếu giá mới < giá gốc, đặt discountPrice = giá gốc ban đầu và price = giá mới
      if (newPrice < p.price) {
        const discountPercent = Math.round(((p.price - newPrice) / p.price) * 100);
        bulkOps.push({
          updateOne: {
            filter: { _id: p._id },
            update: {
              $set: {
                price: newPrice,
                discountPrice: p.price,
                discountPercent: discountPercent
              }
            }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    // Cập nhật trạng thái chiến dịch và snapshot
    campaign.appliedProductsSnapshot = snapshot;
    campaign.status = 'active';
    await campaign.save();

    // Xóa bộ nhớ đệm (Cache) để Web hiển thị ngay lập tức
    clearCache('/api/products');

    return campaign;
  }

  /**
   * Hoàn tác (Revert) trả lại giá ban đầu từ snapshot khi tắt hoặc kết thúc chiến dịch
   * @param {string} campaignId 
   * @param {string} targetStatus - 'paused' hoặc 'ended'
   */
  async revertCampaign(campaignId, targetStatus = 'paused') {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Không tìm thấy chiến dịch khuyến mãi');
    }

    if (!campaign.appliedProductsSnapshot || campaign.appliedProductsSnapshot.length === 0) {
      campaign.status = targetStatus;
      await campaign.save();
      return campaign;
    }

    const bulkOps = [];
    for (const item of campaign.appliedProductsSnapshot) {
      let pr = item.originalPrice;
      let dp = item.originalDiscountPrice;
      let dpPercent = 0;

      if (dp && pr && Number(dp) > Number(pr)) {
        dpPercent = Math.round(((dp - pr) / dp) * 100);
      } else {
        dp = null;
        dpPercent = 0;
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: item.productId },
          update: {
            $set: {
              price: pr,
              discountPrice: dp,
              discountPercent: dpPercent
            }
          }
        }
      });
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    campaign.appliedProductsSnapshot = [];
    campaign.status = targetStatus;
    await campaign.save();

    clearCache('/api/products');

    return campaign;
  }
}

export default new CampaignService();
