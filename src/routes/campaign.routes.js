import express from 'express';
import Campaign from '../models/Campaign.js';
import campaignService from '../services/campaign.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';

const router = express.Router();

// Tất cả endpoints quản lý chiến dịch đều yêu cầu quyền admin
router.use(verifyToken, verifyRole(['admin']));

// Lấy danh sách chiến dịch có phân trang và lọc theo trạng thái
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) filter.$text = { $search: search };

    const campaigns = await Campaign.find(filter)
      .populate('targetCategories', 'name')
      .populate('targetProducts', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    return sendSuccess(res, { campaigns, page, pages, total }, 'Lấy danh sách chiến dịch thành công', 200);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return sendError(res, 'Lấy danh sách chiến dịch thất bại', 500);
  }
});

// Lấy chi tiết 1 chiến dịch
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('targetCategories', 'name')
      .populate('targetProducts', 'name price images');
    if (!campaign) {
      return sendError(res, 'Không tìm thấy chiến dịch', 404);
    }
    return sendSuccess(res, campaign, 'Chi tiết chiến dịch', 200);
  } catch (error) {
    return sendError(res, 'Lấy chi tiết chiến dịch thất bại', 500);
  }
});

// Tạo chiến dịch mới
router.post('/', async (req, res) => {
  try {
    const { name, discountType, discountValue, targetType } = req.body;
    if (!name || !discountType || discountValue === undefined || !targetType) {
      return sendError(res, 'Vui lòng điền đầy đủ các trường thông tin bắt buộc', 400);
    }

    const campaign = new Campaign(req.body);
    await campaign.save();

    const populated = await Campaign.findById(campaign._id)
      .populate('targetCategories', 'name')
      .populate('targetProducts', 'name price images');

    return sendSuccess(res, populated, 'Tạo chiến dịch thành công', 201);
  } catch (error) {
    console.error('Create campaign error:', error);
    return sendError(res, error.message || 'Tạo chiến dịch thất bại', 500);
  }
});

// Cập nhật chiến dịch (chỉ khi đang ở trạng thái draft hoặc paused)
router.patch('/:id', async (req, res) => {
  try {
    const current = await Campaign.findById(req.params.id);
    if (!current) return sendError(res, 'Không tìm thấy chiến dịch', 404);

    if (current.status === 'active') {
      return sendError(res, 'Vui lòng tạm dừng chiến dịch trước khi chỉnh sửa thông tin', 400);
    }

    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('targetCategories', 'name')
      .populate('targetProducts', 'name price images');

    return sendSuccess(res, campaign, 'Cập nhật chiến dịch thành công', 200);
  } catch (error) {
    return sendError(res, 'Cập nhật chiến dịch thất bại', 500);
  }
});

// Xóa chiến dịch (nếu đang active -> tự động revert trả lại giá gốc trước khi xóa)
router.delete('/:id', async (req, res) => {
  try {
    const current = await Campaign.findById(req.params.id);
    if (!current) return sendError(res, 'Không tìm thấy chiến dịch', 404);

    if (current.status === 'active') {
      await campaignService.revertCampaign(req.params.id, 'ended');
    }

    await Campaign.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Đã xóa chiến dịch và hoàn tác giá', 200);
  } catch (error) {
    console.error('Delete campaign error:', error);
    return sendError(res, 'Xóa chiến dịch thất bại', 500);
  }
});

// Kích hoạt áp dụng (Apply) hoặc Tạm dừng hoàn tác (Revert) chiến dịch
router.post('/:id/toggle', async (req, res) => {
  try {
    const { action } = req.body; // 'apply' hoặc 'revert'
    if (!action || !['apply', 'revert'].includes(action)) {
      return sendError(res, 'Hành động không hợp lệ (apply hoặc revert)', 400);
    }

    let campaign;
    if (action === 'apply') {
      campaign = await campaignService.applyCampaign(req.params.id);
    } else {
      campaign = await campaignService.revertCampaign(req.params.id, 'paused');
    }

    const populated = await Campaign.findById(campaign._id)
      .populate('targetCategories', 'name')
      .populate('targetProducts', 'name price images');

    const msg = action === 'apply' 
      ? '🚀 Đã kích hoạt áp dụng giảm giá đồng loạt cho kho hàng!' 
      : '⏸️ Đã tạm dừng chiến dịch và khôi phục giá niêm yết ban đầu!';

    return sendSuccess(res, populated, msg, 200);
  } catch (error) {
    console.error('Toggle campaign error:', error);
    return sendError(res, error.message || 'Thay đổi trạng thái chiến dịch thất bại', 500);
  }
});

export default router;
