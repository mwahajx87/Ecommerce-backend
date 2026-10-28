export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    joinedDate: user.createdAt.toISOString().slice(0, 10)
  };
}

export function serializeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    styles: product.styles,
    colors: product.colors,
    sizes: product.sizes,
    price: product.price,
    oldPrice: product.oldPrice,
    discount: product.discount,
    stock: product.stock,
    stockStatus: product.stockStatus,
    image: product.image,
    description: product.description
  };
}

export function serializeOrder(order) {
  return {
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerAddress: order.customerAddress,
    paymentMethod: order.paymentMethod,
    items: order.items,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total: order.total,
    status: order.status,
    date: order.date,
    createdAt: order.createdAt
  };
}
