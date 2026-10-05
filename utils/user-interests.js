export async function updateUserCategories(user, productCategory) {
  if (!productCategory) return;

  // اگر این دسته قبلاً هست، دوباره اضافه نکن
  if (!user.savedCategories.includes(productCategory)) {
    user.savedCategories.push(productCategory);

    // اگر بیشتر از ۵ شد، قدیمی‌ترین را حذف کن
    if (user.savedCategories.length > 5) {
      user.savedCategories.shift();
    }
  }

  await user.save();
}
