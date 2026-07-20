import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import StockLog from '../src/models/StockLog.js';
import Coupon from '../src/models/Coupon.js';
import Review from '../src/models/Review.js';
import Contact from '../src/models/Contact.js';
import Campaign from '../src/models/Campaign.js';

dotenv.config();

const seedDemoData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cd-store';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB at:', mongoUri.split('@')[1] || mongoUri);

    // 1. Fetch existing products (do NOT add new products as requested)
    const products = await Product.find({});
    if (products.length === 0) {
      console.error('❌ No products found in database. Please run product seeder first.');
      process.exit(1);
    }
    console.log(`📦 Found ${products.length} existing products in database.`);

    // 2. Ensure Demo Users exist
    console.log('👥 Creating / Checking Demo Users...');
    const demoUsersData = [
      { name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', phone: '0912345671', role: 'user', status: 'active', address: '123 Nguyễn Huệ, Quận 1, TP. HCM' },
      { name: 'Trần Thị Mai', email: 'mai.tran@example.com', phone: '0912345672', role: 'user', status: 'active', address: '45 Cầu Giấy, Hà Nội' },
      { name: 'Lê Hoàng Long', email: 'long.le@example.com', phone: '0912345673', role: 'user', status: 'active', address: '78 Bạch Đằng, Hải Châu, Đà Nẵng' },
      { name: 'Phạm Thu Thảo', email: 'thao.pham@example.com', phone: '0912345674', role: 'user', status: 'active', address: '12 Lê Lợi, TP. Huế' },
      { name: 'Hoàng Đức Thắng', email: 'thang.hoang@example.com', phone: '0912345675', role: 'user', status: 'active', address: '56 Trần Phú, Nha Trang' },
      { name: 'Vũ Phương Uyên', email: 'uyen.vu@example.com', phone: '0912345676', role: 'user', status: 'active', address: '89 Hùng Vương, Cần Thơ' },
      { name: 'Bùi Quang Vinh', email: 'vinh.bui@example.com', phone: '0912345677', role: 'user', status: 'active', address: '34 Hai Bà Trưng, Biên Hòa' },
      { name: 'Đặng Hương Ly', email: 'ly.dang@example.com', phone: '0912345678', role: 'user', status: 'active', address: '90 Hoàng Văn Thụ, TP. HCM' },
    ];

    const defaultPasswordHash = await bcryptjs.hash('123456', 10);
    const savedUsers = [];

    // Also get admin user or create one for logs
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Quản Trị Viên Hệ Thống',
        email: 'admin.demo@example.com',
        phone: '0999999999',
        passwordHash: defaultPasswordHash,
        role: 'admin',
        status: 'active',
        address: 'Trụ sở chính Crying Day Store'
      });
    }

    for (const u of demoUsersData) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        existing = await User.create({ ...u, passwordHash: defaultPasswordHash });
      }
      savedUsers.push(existing);
    }
    console.log(`✅ Ready with ${savedUsers.length} demo users and 1 admin.`);

    // 3. Clear & Seed Orders (last 30 days) for analytics & charts
    console.log('🛒 Seeding Demo Orders & Analytics...');
    await Order.deleteMany({});
    const ordersToInsert = [];
    const statuses = ['delivered', 'delivered', 'delivered', 'delivered', 'pending', 'pending', 'confirmed', 'shipped', 'cancelled'];

    for (let i = 0; i < 28; i++) {
      const daysAgo = Math.floor(Math.random() * 29) + 1;
      const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const randomUser = savedUsers[i % savedUsers.length];
      const status = statuses[i % statuses.length];

      // Pick 1-3 random products
      const numItems = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const prod = products[(i + j * 5) % products.length];
        const qty = Math.floor(Math.random() * 2) + 1;
        const itemPrice = prod.discountPrice || prod.price || 100;
        subtotal += itemPrice * qty;
        orderItems.push({
          productId: prod._id,
          name: prod.name,
          price: itemPrice,
          quantity: qty,
          image: prod.images?.[0] || 'https://via.placeholder.com/150'
        });
      }

      const shippingFee = subtotal > 200 ? 0 : 15;
      const total = subtotal + shippingFee;

      ordersToInsert.push({
        orderNumber: `ORD-202607-${1000 + i}`,
        userId: randomUser._id,
        items: orderItems,
        shippingAddress: {
          name: randomUser.name,
          phone: randomUser.phone,
          address: randomUser.address || '123 Demo Street',
          city: 'TP. HCM'
        },
        paymentMethod: i % 2 === 0 ? 'cod' : 'qr',
        paymentStatus: status === 'delivered' ? 'completed' : 'pending',
        orderStatus: status,
        subtotal,
        shippingFee,
        total,
        totalAmount: total,
        stockDeducted: status === 'confirmed' || status === 'shipped' || status === 'delivered',
        createdAt: orderDate,
        updatedAt: orderDate
      });
    }

    const createdOrders = await Order.insertMany(ordersToInsert);
    console.log(`✅ Created ${createdOrders.length} demo orders across the last 30 days.`);

    // 4. Adjust existing products stock (set 4 products <= 10 for Low Stock Alerts demo)
    console.log('⚡ Adjusting 4 existing products to have low stock (for Low Stock Alerts panel demo)...');
    if (products.length >= 4) {
      products[0].stock = 3;
      products[1].stock = 5;
      products[2].stock = 8;
      products[3].stock = 0; // Out of stock
      await products[0].save();
      await products[1].save();
      await products[2].save();
      await products[3].save();
    }

    // 5. Clear & Seed StockLog (Stock Ledger tab)
    console.log('📋 Seeding Stock Audit Logs (Stock Ledger)...');
    await StockLog.deleteMany({});
    const stockLogsToInsert = [];
    const logTypes = ['import', 'order_deduction', 'cancellation_return', 'manual_adjustment'];

    for (let i = 0; i < 24; i++) {
      const prod = products[i % products.length];
      const type = logTypes[i % logTypes.length];
      let qtyChange = 0;
      let prevStock = prod.stock || 20;
      let newStock = prevStock;
      let note = '';

      if (type === 'import') {
        qtyChange = Math.floor(Math.random() * 30) + 10;
        newStock = prevStock + qtyChange;
        note = `Nhập kho lô hàng mới đợt #${Math.floor(i / 4) + 1} tháng 7/2026`;
      } else if (type === 'order_deduction') {
        qtyChange = -(Math.floor(Math.random() * 3) + 1);
        newStock = Math.max(0, prevStock + qtyChange);
        note = `Trừ kho tự động khi xác nhận đơn hàng ORD-202607-${1000 + i}`;
      } else if (type === 'cancellation_return') {
        qtyChange = Math.floor(Math.random() * 2) + 1;
        newStock = prevStock + qtyChange;
        note = `Hoàn trả kho tự động do hủy đơn hàng ORD-202607-${1000 + i}`;
      } else {
        qtyChange = i % 2 === 0 ? -2 : 5;
        newStock = Math.max(0, prevStock + qtyChange);
        note = 'Kiểm kê kho định kỳ, cân bằng lại số lượng thực tế với sổ sách';
      }

      stockLogsToInsert.push({
        productId: prod._id,
        type,
        quantityChange: qtyChange,
        previousStock: prevStock,
        newStock: newStock,
        note,
        performedBy: adminUser._id,
        createdAt: new Date(Date.now() - (25 - i) * 12 * 60 * 60 * 1000)
      });
    }

    await StockLog.insertMany(stockLogsToInsert);
    console.log(`✅ Created ${stockLogsToInsert.length} Stock Ledger audit logs.`);

    // 6. Clear & Seed Coupons
    console.log('🎟️ Seeding Demo Coupons...');
    await Coupon.deleteMany({});
    const coupons = [
      { code: 'WELCOME10', type: 'percent', value: 10, minOrderValue: 50, maxUsage: 1000, usedCount: 142, expiredAt: new Date('2026-12-31'), isActive: true },
      { code: 'SUMMER2026', type: 'percent', value: 15, minOrderValue: 100, maxUsage: 500, usedCount: 89, expiredAt: new Date('2026-08-31'), isActive: true },
      { code: 'FREESHIP50', type: 'fixed', value: 15, minOrderValue: 50, maxUsage: 200, usedCount: 195, expiredAt: new Date('2026-09-15'), isActive: true },
      { code: 'VIP500', type: 'fixed', value: 30, minOrderValue: 300, maxUsage: 100, usedCount: 45, expiredAt: new Date('2026-11-30'), isActive: true },
      { code: 'FLASHSALE30', type: 'percent', value: 30, minOrderValue: 200, maxUsage: 50, usedCount: 50, expiredAt: new Date('2026-07-25'), isActive: false },
      { code: 'TET2027', type: 'percent', value: 20, minOrderValue: 150, maxUsage: 888, usedCount: 0, expiredAt: new Date('2027-02-15'), isActive: true },
    ];
    await Coupon.insertMany(coupons);
    console.log(`✅ Created ${coupons.length} demo coupons.`);

    // 7. Clear & Seed Reviews (ensure unique productId + userId)
    console.log('⭐ Seeding Demo Product Reviews...');
    await Review.deleteMany({});
    const reviewComments = [
      'Chất lượng sản phẩm hoàn hảo, đóng gói cực kỳ cẩn thận chống sốc 3 lớp, giao hàng thần tốc ngay trong ngày!',
      'Thiết kế đẹp mắt, sang trọng đúng như hình chụp trên website. Dùng rất mượt mà và ổn định, rất đáng tiền.',
      'Shop tư vấn cực kỳ nhiệt tình và chu đáo. Đã check bảo hành chính hãng đầy đủ 12 tháng, sẽ tiếp tục ủng hộ shop.',
      'Âm thanh cực kỳ sắc nét, bass sâu nảy không bị ù tai. Pin trâu dùng cả tuần mới phải sạc lại, rất hài lòng!',
      'Sản phẩm tốt trong tầm giá. Màn hình sắc nét màu chuẩn, bàn phím gõ êm ái thích hợp cho lập trình viên và đồ họa.',
      'Giao hàng nhanh, shopee express chuyên nghiệp. Hàng chuẩn nguyên seal mới 100%, có kèm hóa đơn đầy đủ.',
      'Màu sắc bên ngoài nhìn còn sang đẹp hơn trên hình. Tốc độ xử lý cực kỳ nhanh gọn không hề bị giật lag.',
      'Hàng chính hãng 100%, kết nối nhanh chóng ổn định với cả iPhone và MacBook. Vote cho shop 5 sao chất lượng!'
    ];
    const reviewsToInsert = [];
    const usedReviewPairs = new Set();
    for (let i = 0; i < 20; i++) {
      const prod = products[i % products.length];
      const usr = savedUsers[(i * 3) % savedUsers.length];
      const pairKey = `${prod._id}_${usr._id}`;
      if (!usedReviewPairs.has(pairKey)) {
        usedReviewPairs.add(pairKey);
        reviewsToInsert.push({
          productId: prod._id,
          userId: usr._id,
          rating: i % 7 === 0 ? 4 : 5,
          comment: reviewComments[i % reviewComments.length],
          createdAt: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000)
        });
      }
    }
    await Review.insertMany(reviewsToInsert);
    console.log(`✅ Created ${reviewsToInsert.length} product reviews.`);

    // 8. Clear & Seed Contacts
    console.log('💬 Seeding Demo Customer Contacts...');
    await Contact.deleteMany({});
    const contacts = [
      { name: 'Phan Anh Tuấn', email: 'tuan.pa@gmail.com', phone: '0901234567', subject: 'Hỏi về chính sách mua trả góp 0% qua thẻ tín dụng', message: 'Chào shop, tôi muốn hỏi mua trả góp chiếc MacBook Pro 14 inch qua thẻ Sacombank thì thủ tục và kỳ hạn 12 tháng ra sao?', status: 'unread', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { name: 'Nguyễn Thúy Nga', email: 'nga.nt@yahoo.com', phone: '0907654321', subject: 'Giao hàng hỏa tốc đi thành phố Hải Phòng mất bao lâu?', message: 'Tôi cần đặt mua tai nghe AirPods Pro làm quà sinh nhật vào cuối tuần này, shop giao hỏa tốc về Hải Phòng được kịp không ạ?', status: 'unread', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
      { name: 'Công Ty TNHH TechVibe', email: 'contact@techvibe.vn', phone: '0283829102', subject: 'Yêu cầu báo giá và xuất hóa đơn VAT cho đơn hàng doanh nghiệp', message: 'Doanh nghiệp chúng tôi cần mua 10 chiếc màn hình Dell UltraSharp và 5 bàn phím cơ. Vui lòng gửi báo giá chiết khấu kèm mẫu hóa đơn GTGT.', status: 'read', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { name: 'Trần Minh Đức', email: 'duc.tran@outlook.com', phone: '0933445566', subject: 'Hỏi về trung tâm bảo hành và chính sách đổi trả 30 ngày', message: 'Cho mình hỏi nếu máy mua về bị lỗi điểm ảnh từ nhà sản xuất thì quy trình đổi mới 1-1 diễn ra tại showroom hay gửi bảo hành hãng?', status: 'replied', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { name: 'Lê Diễm My', email: 'my.le@gmail.com', phone: '0988776655', subject: 'Tư vấn lựa chọn smartwatch cho nữ cổ tay nhỏ', message: 'Mình cổ tay 14cm đang phân vân giữa Apple Watch Series 9 41mm và Garmin Lily, nhờ shop tư vấn mẫu nào đeo ôm tay và sang hơn ạ?', status: 'replied', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
    ];
    await Contact.insertMany(contacts);
    console.log(`✅ Created ${contacts.length} customer contact inquiries.`);

    // 9. Clear & Seed Campaigns
    console.log('🏷️ Seeding Demo Promotional Campaigns...');
    await Campaign.deleteMany({});
    const campaigns = [
      {
        name: '🔥 Siêu Sale Cuối Tuần - Giảm 15% Toàn Bộ Cửa Hàng',
        description: 'Chiến dịch tri ân khách hàng mua sắm cuối tuần mùa hè sôi động với mức giảm giá đồng loạt 15%',
        discountType: 'percent',
        discountValue: 15,
        badgeText: 'SALE 15%',
        targetType: 'all_products',
        status: 'draft',
        isUnlimitedTime: true,
        appliedProductsSnapshot: [],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        name: '⚡ Giờ Vàng Công Nghệ - Giảm Trực Tiếp $30 Cho Laptops',
        description: 'Chương trình trợ giá đặc biệt dành cho sinh viên và người đi làm khi sắm máy tính xách tay chất lượng cao',
        discountType: 'fixed',
        discountValue: 30,
        badgeText: 'GIẢM $30',
        targetType: 'by_categories',
        status: 'paused',
        isUnlimitedTime: false,
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        appliedProductsSnapshot: [],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ];
    await Campaign.insertMany(campaigns);
    console.log(`✅ Created ${campaigns.length} demo promotional campaigns.`);

    console.log('🎉 DEMO DATA SEEDING COMPLETED SUCCESSFULLY! ALL TABLES ARE FULL OF VIBRANT DATA.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  }
};

seedDemoData();
