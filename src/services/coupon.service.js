import Coupon from '../models/Coupon.js';
import Newsletter from '../models/Newsletter.js';
import User from '../models/User.js';

/**
 * Validate coupon eligibility based on all rules:
 * - Active status & Time validity (or isUnlimitedTime)
 * - Store-wide usage limit (maxUsage)
 * - Per-user usage limit (usagePerUserLimit)
 * - VIP Newsletter privilege requirement (requiresNewsletter / VIP100)
 * - Specific allowed emails check (allowedEmails)
 * - Minimum order value requirement (minOrderValue)
 */
export const validateCoupon = async ({ code, userId, userEmail, orderValue = 0, checkUserLimits = true }) => {
  if (!code) {
    return { success: false, code: 'MISSING_CODE', message: 'Vui lòng nhập mã giảm giá.' };
  }

  const upperCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: upperCode });

  if (!coupon || !coupon.isActive) {
    return { success: false, code: 'INVALID_COUPON', message: 'Mã giảm giá không tồn tại hoặc đã ngừng hoạt động.' };
  }

  // 1. Check time validity
  if (!coupon.isUnlimitedTime) {
    if (coupon.startDate && new Date() < new Date(coupon.startDate)) {
      return { success: false, code: 'NOT_STARTED', message: 'Mã giảm giá chưa đến thời gian áp dụng.' };
    }
    if (coupon.expiredAt && new Date() > new Date(coupon.expiredAt)) {
      return { success: false, code: 'EXPIRED', message: 'Mã giảm giá đã hết hạn sử dụng.' };
    }
  }

  // 2. Check store-wide max usage
  if (coupon.maxUsage !== null && coupon.maxUsage !== undefined && coupon.maxUsage > 0) {
    if (coupon.usedCount >= coupon.maxUsage) {
      return { success: false, code: 'LIMIT_REACHED', message: 'Mã giảm giá đã hết lượt sử dụng trên toàn hệ thống.' };
    }
  }

  // Resolve user email if only userId is provided
  let resolvedEmail = userEmail ? userEmail.trim().toLowerCase() : null;
  if (userId && !resolvedEmail) {
    const userObj = await User.findById(userId);
    if (userObj && userObj.email) {
      resolvedEmail = userObj.email.trim().toLowerCase();
    }
  }

  // 3. Check VIP Newsletter subscriber privilege (requiresNewsletter OR VIP100)
  if (coupon.requiresNewsletter || upperCode === 'VIP100') {
    if (!resolvedEmail) {
      return {
        success: false,
        code: 'NEWSLETTER_REQUIRED',
        message: 'Mã ưu đãi VIP100 chỉ dành cho Thành Viên VIP đã gửi thông tin bản tin. Vui lòng đăng nhập hoặc đăng ký email ở chân trang trước khi sử dụng!'
      };
    }
    const subscriber = await Newsletter.findOne({ email: resolvedEmail, isActive: true });
    if (!subscriber) {
      return {
        success: false,
        code: 'NEWSLETTER_REQUIRED',
        message: 'Mã giảm giá VIP100 là đặc quyền dành riêng cho Thành Viên VIP đã gửi thông tin đăng ký bản tin. Vui lòng đăng ký email ở phần Đặc Quyền VIP (chân trang) trước khi áp dụng!'
      };
    }
  }

  // 4. Check allowed specific emails
  if (coupon.allowedEmails && coupon.allowedEmails.length > 0) {
    if (!resolvedEmail || !coupon.allowedEmails.includes(resolvedEmail)) {
      return { success: false, code: 'NOT_ELIGIBLE', message: 'Mã giảm giá này chỉ dành riêng cho danh sách khách hàng được chỉ định.' };
    }
  }

  // 5. Check per-user usage limit (usagePerUserLimit)
  if (checkUserLimits && userId && coupon.usagePerUserLimit !== null && coupon.usagePerUserLimit !== undefined && coupon.usagePerUserLimit > 0) {
    const userUsageCount = (coupon.usedBy || []).filter(
      id => id && id.toString() === userId.toString()
    ).length;

    if (userUsageCount >= coupon.usagePerUserLimit) {
      return {
        success: false,
        code: 'USER_LIMIT_REACHED',
        message: `Mã ưu đãi này mỗi tài khoản chỉ được sử dụng tối đa ${coupon.usagePerUserLimit} lần. Bạn đã sử dụng hết lượt!`
      };
    }
  }

  // 6. Check minimum order value
  if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
    return {
      success: false,
      code: 'MIN_ORDER_VALUE',
      message: `Đơn hàng tối thiểu để áp dụng mã này là $${coupon.minOrderValue.toFixed(2)}. Bạn cần mua thêm $${(coupon.minOrderValue - orderValue).toFixed(2)} nữa.`
    };
  }

  // Calculate discount amount
  let discount = coupon.type === 'percent' ? (orderValue * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  return {
    success: true,
    coupon,
    discountAmount: Math.max(0, discount)
  };
};
