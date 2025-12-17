export const translations = {
  en: {
    common: {
      apply: "Apply",
      cancel: "Cancel"
    },
    nav: {
      dashboard: "Dashboard",
      orders: "Orders",
      inventory: "Inventory",
      customers: "Customers",
      suppliers: "Suppliers",
      users: "User Management",
      transactions: "Transactions",
      settings: "Settings",
      signOut: "Sign Out",
      newOrder: "New Order",
      soon: "SOON"
    },
    header: {
      dashboardTitle: "Dashboard Overview",
      ordersTitle: "Order Management",
      inventoryTitle: "Product Inventory",
      customersTitle: "Customer Management",
      suppliersTitle: "Supplier Management",
      usersTitle: "User Management",
      transactionsTitle: "Payment Transactions",
      systemOp: "System Operational"
    },
    dashboard: {
      totalRevenue: "Total Revenue",
      totalOrders: "Total Orders",
      pending: "Pending",
      avgOrderValue: "Avg. Order Value",
      revenueTrend: "Revenue Trend",
      fromLastWeek: "from last week",
      newToday: "new today",
      requiresAttention: "Requires attention",
      fromYesterday: "from yesterday",
      aiTitle: "Gemini Insights",
      analyzing: "Analyzing data...",
      updateAnalysis: "Update Analysis",
      generateBrief: "Generate Daily Brief",
      aiPlaceholder: "Generate a real-time AI analysis of your current order trends, potential risks, and operational suggestions using Google Gemini.",
      filterWeek: "Week",
      filterMonth: "Month",
      filterYear: "Year"
    },
    orders: {
      recent: "Recent Orders",
      searchPlaceholder: "Search ID or Customer...",
      filterProductPlaceholder: "Filter product...",
      filters: "Filters",
      fromDate: "From date",
      toDate: "To date",
      startDate: "Start Month",
      endDate: "End Month",
      allMonths: "All Months",
      allStatus: "All Status",
      noOrders: "No orders found.",
      noOrdersCriteria: "No orders found matching your criteria.",
      createFirst: "Create First Order",
      showing: "Showing",
      of: "of",
      viewDetails: "View Details",
      tableId: "ID",
      tableDate: "Date",
      tableDeliveryDate: "Delivery date",
      tableCreatedUpdated: "Created / Updated",
      tableCustomer: "Customer",
      tableProduct: "Product",
      tableStatus: "Status",
      tableTotal: "Total",
      tableActions: "Actions",
      labelCreated: "Created",
      labelUpdated: "Updated",
      statusLabels: {
        PENDING: "Pending",
        PROCESSING: "Processing",
        DELIVERED: "Delivered",
        CANCELLED: "Cancelled",
        RETURNED: "Returned"
      },
      paymentStatusLabels: {
        PAID: "Paid",
        UNPAID: "Unpaid",
        REFUNDED: "Refunded"
      },
      delete: "Delete Order",
      confirmDelete: "Are you sure you want to delete this order? This action cannot be undone.",
      exportCsv: "Export CSV",
      exportTitle: "Export Order Data",
      exportCurrentMonth: "Current Month",
      exportMonth: "Select Month",
      exportAllTime: "All Time",
      exportCustom: "Custom Range",
      exportStart: "Start Date",
      exportEnd: "End Date",
      exportCancel: "Cancel",
      exportConfirm: "Export"
    },
    inventory: {
      title: "Products",
      addProduct: "Add Product",
      searchPlaceholder: "Search products...",
      noProducts: "No products found.",
      createFirst: "Add your first product",
      productsTab: "Products",
      ingredientsTab: "Ingredients",
      recipesTab: "Recipes",
      ingredientsPlaceholder: "Ingredient tracking has been disabled in this version.",
      recipesPlaceholder: "Recipes module is coming soon.",
      formTitleAdd: "Add New Product",
      formTitleEdit: "Edit Product",
      name: "Product Name",
      price: "Price (VND)",
      category: "Category",
      image: "Image URL",
      description: "Description",
      status: "Status",
      active: "Active",
      inactive: "Inactive",
      deleteConfirm: "Are you sure you want to delete this product?"
    },
    customers: {
      title: "Customers",
      add: "Add Customer",
      search: "Search customers...",
      noData: "No customers found.",
      createFirst: "Add your first customer",
      table: {
        name: "Customer",
        contact: "Contact Info",
        location: "Location",
        totalProducts: "Total Products",
        actions: "Actions"
      },
      form: {
        addTitle: "Add New Customer",
        editTitle: "Edit Customer",
        name: "Full Name",
        email: "Email",
        phone: "Phone Number",
        address: "Address",
        city: "City",
        country: "Country",
        save: "Save Customer"
      },
      delete: {
        title: "Delete Customer",
        confirm: "Are you sure you want to delete this customer? This action cannot be undone."
      }
    },
    suppliers: {
      title: "Suppliers",
      add: "Add Supplier",
      search: "Search suppliers...",
      noData: "No suppliers found.",
      createFirst: "Add your first supplier",
      form: {
        addTitle: "Add New Supplier",
        editTitle: "Edit Supplier",
        name: "Supplier Name",
        namePlaceholder: "e.g. Flour Co., Sugar Ltd.",
        contactName: "Contact Person",
        contactPlaceholder: "Contact name",
        phone: "Phone",
        email: "Email",
        address: "Address",
        addressPlaceholder: "Street, City",
        note: "Note",
        notePlaceholder: "Additional notes...",
        save: "Save Supplier",
        errors: {
          nameRequired: "Supplier name is required",
          saveFailed: "Unable to save supplier"
        }
      },
      delete: {
        title: "Delete Supplier",
        confirm: "Are you sure you want to delete this supplier? This action cannot be undone."
      },
      table: {
        name: "Supplier",
        contact: "Contact",
        actions: "Actions"
      }
    },
    users: {
      title: "User Management",
      searchPlaceholder: "Search by name, email...",
      noUsers: "No users found.",
      stats: {
        total: "Total Users",
        pending: "Pending",
        active: "Active",
        inactive: "Inactive"
      },
      status: {
        pending: "Pending",
        active: "Active",
        inactive: "Inactive"
      },
      role: {
        superAdmin: "Super Admin",
        admin: "Admin",
        colaborator: "Colaborator"
      },
      filter: {
        all: "All Status"
      },
      table: {
        user: "User",
        customName: "Custom Name",
        role: "Role",
        status: "Status",
        lastLogin: "Last Login",
        actions: "Actions"
      },
      actions: {
        approve: "Approve",
        activate: "Activate",
        deactivate: "Deactivate",
        edit: "Edit",
        cancel: "Cancel",
        save: "Save"
      },
      messages: {
        statusUpdated: "User status updated successfully",
        customNameUpdated: "Custom name updated successfully",
        roleUpdated: "User role updated successfully",
        loadError: "Failed to load users",
        updateStatusError: "Failed to update status",
        updateCustomNameError: "Failed to update custom name",
        updateRoleError: "Failed to update role"
      }
    },
    transactions: {
      title: "Transactions",
      searchPlaceholder: "Search order #, content...",
      noData: "No transactions found.",
      table: {
        date: "Date",
        amount: "Amount",
        orderNumber: "Order Ref",
        content: "Content",
        gateway: "Gateway",
        account: "Account"
      }
    },
    form: {
      createTitle: "Create New Order",
      editTitle: "Edit Order",
      customerDetails: "Customer Details",
      customerName: "Customer Name",
      phone: "Phone Number",
      address: "Delivery Address",
      orderInfo: "Order Info",
      productType: "Product Type",
      customName: "Tên sản phẩm",
      customPlaceholder: "e.g. Special Cake",
      quantity: "Quantity",
      unitPrice: "Unit Price (VND)",
      shippingCost: "Shipping Cost (VND)",
      totalEstimate: "Total Estimate",
      status: "Status",
      note: "Note",
      cancel: "Cancel",
      save: "Save Order",
      saving: "Saving...",
      saveProduct: "Save Product"
    },
    detail: {
      orderId: "Order #",
      placedOn: "Placed on",
      tabDetails: "Order Details",
      tabAi: "AI Assistant",
      customer: "Customer",
      shippingAddress: "Shipping Address",
      items: "Items",
      subtotal: "Subtotal",
      shipping: "Shipping",
      total: "Total",
      fulfillment: "Fulfillment",
      tracking: "Tracking Number",
      payment: "Payment Status",
      paymentMethod: "Payment Method",
      transactionNumber: "Transaction Number",
      notAssigned: "Not assigned",
      note: "Note",
      noNote: "No note provided",
      close: "Close",
      edit: "Edit Order",
      aiIntro: "Use advanced AI to analyze this order, draft communications, or assess risk factors instantly.",
      draftEmail: "Draft Email",
      riskCheck: "Risk Check",
      summarize: "Summarize",
      copyClipboard: "Copy to Clipboard",
      consulting: "Consulting Gemini..."
    },
    paymentMethod: {
      label: "Payment Method",
      cash: "Cash",
      banking: "Banking"
    },
    qr: {
      sectionTitle: "Payment QR",
      title: "Bank Transfer (VietQR)",
      bank: "Bank",
      account: "Account",
      accountName: "Name",
      amount: "Amount",
      content: "Content",
      instruction: "Scan with any banking app to pay."
    },
    login: {
      welcome: "Welcome back! Please sign in to continue.",
      googleButton: "Sign in with Google",
      currentAccount: "Current Account",
      useCurrentAccount: "Continue with this account",
      switchAccount: "Switch Account / Add New",
      recentAccounts: "Recent Accounts",
      accountRemoved: "Account removed from history",
      removeAccount: "Remove account"
    }
  },
  vi: {
    common: {
      apply: "Áp dụng",
      cancel: "Hủy"
    },
    nav: {
      dashboard: "Tổng quan",
      orders: "Đơn hàng",
      inventory: "Kho hàng",
      customers: "Khách hàng",
      suppliers: "Nhà cung cấp",
      users: "Quản lý người dùng",
      transactions: "Giao dịch",
      settings: "Cài đặt",
      signOut: "Đăng xuất",
      newOrder: "Tạo đơn",
      soon: "SẮP RA"
    },
    header: {
      dashboardTitle: "Tổng quan hệ thống",
      ordersTitle: "Quản lý đơn hàng",
      inventoryTitle: "Kho sản phẩm",
      customersTitle: "Quản lý khách hàng",
      suppliersTitle: "Quản lý nhà cung cấp",
      transactionsTitle: "Lịch sử giao dịch",
      usersTitle: "Quản lý người dùng",
      systemOp: "Hệ thống ổn định"
    },
    dashboard: {
      totalRevenue: "Tổng doanh thu",
      totalOrders: "Tổng đơn hàng",
      pending: "Chờ xử lý",
      avgOrderValue: "Giá trị TB",
      revenueTrend: "Biểu đồ doanh thu",
      fromLastWeek: "so với tuần trước",
      newToday: "đơn mới hôm nay",
      requiresAttention: "Cần chú ý",
      fromYesterday: "so với hôm qua",
      aiTitle: "Phân tích Gemini",
      analyzing: "Đang phân tích...",
      updateAnalysis: "Cập nhật phân tích",
      generateBrief: "Tạo báo cáo ngày",
      aiPlaceholder: "Sử dụng AI để phân tích xu hướng bán hàng, rủi ro tiềm ẩn và đề xuất vận hành theo thời gian thực.",
      filterWeek: "Tuần",
      filterMonth: "Tháng",
      filterYear: "Năm"
    },
    orders: {
      recent: "Đơn hàng gần đây",
      searchPlaceholder: "Tìm ID hoặc Khách hàng...",
      filterProductPlaceholder: "Lọc theo sản phẩm...",
      filters: "Bộ lọc",
      fromDate: "Từ ngày",
      toDate: "Đến ngày",
      startDate: "Tháng bắt đầu",
      endDate: "Tháng kết thúc",
      allMonths: "Tất cả các tháng",
      allStatus: "Tất cả trạng thái",
      noOrders: "Chưa có đơn hàng nào.",
      noOrdersCriteria: "Không tìm thấy đơn hàng phù hợp.",
      createFirst: "Tạo đơn đầu tiên",
      showing: "Hiển thị",
      of: "trên",
      viewDetails: "Xem chi tiết",
      tableId: "ID",
      tableDate: "Ngày",
      tableDeliveryDate: "Ngày giao",
      tableCreatedUpdated: "Tạo / Sửa",
      tableCustomer: "Khách hàng",
      tableProduct: "Sản phẩm",
      tableStatus: "Trạng thái",
      tableTotal: "Tổng tiền",
      tableActions: "Thao tác",
      labelCreated: "Tạo",
      labelUpdated: "Sửa",
      statusLabels: {
        PENDING: "Chờ xử lý",
        PROCESSING: "Đang xử lý",
        DELIVERED: "Đã giao",
        CANCELLED: "Đã hủy",
        RETURNED: "Trả hàng"
      },
      paymentStatusLabels: {
        PAID: "Đã thanh toán",
        UNPAID: "Chưa thanh toán",
        REFUNDED: "Đã hoàn trả"
      },
      delete: "Xóa đơn hàng",
      confirmDelete: "Bạn có chắc chắn muốn xóa đơn hàng này không? Hành động này không thể hoàn tác.",
      exportCsv: "Xuất CSV",
      exportTitle: "Xuất dữ liệu đơn hàng",
      exportCurrentMonth: "Tháng này",
      exportMonth: "Chọn tháng",
      exportAllTime: "Tất cả",
      exportCustom: "Tùy chỉnh",
      exportStart: "Từ ngày",
      exportEnd: "Đến ngày",
      exportCancel: "Hủy",
      exportConfirm: "Xuất file"
    },
    inventory: {
      title: "Sản phẩm",
      addProduct: "Thêm sản phẩm",
      searchPlaceholder: "Tìm kiếm sản phẩm...",
      noProducts: "Chưa có sản phẩm nào.",
      createFirst: "Thêm sản phẩm đầu tiên",
      productsTab: "Sản phẩm",
      ingredientsTab: "Nguyên liệu",
      recipesTab: "Công thức",
      ingredientsPlaceholder: "Theo dõi nguyên liệu đã được tạm ẩn ở phiên bản này.",
      recipesPlaceholder: "Tính năng công thức sẽ sớm ra mắt.",
      formTitleAdd: "Thêm sản phẩm mới",
      formTitleEdit: "Sửa sản phẩm",
      name: "Tên sản phẩm",
      price: "Giá (VND)",
      category: "Danh mục",
      image: "Link ảnh",
      description: "Mô tả",
      status: "Trạng thái",
      active: "Hoạt động",
      inactive: "Ngừng bán",
      deleteConfirm: "Bạn có chắc chắn muốn xóa sản phẩm này không?"
    },
    customers: {
      title: "Khách hàng",
      add: "Thêm khách hàng",
      search: "Tìm kiếm khách hàng...",
      noData: "Không tìm thấy khách hàng.",
      createFirst: "Thêm khách hàng đầu tiên",
      table: {
        name: "Khách hàng",
        contact: "Liên hệ",
        location: "Địa chỉ",
        totalProducts: "Tổng sản phẩm",
        actions: "Thao tác"
      },
      form: {
        addTitle: "Thêm khách hàng mới",
        editTitle: "Sửa thông tin khách hàng",
        name: "Họ và tên",
        email: "Email",
        phone: "Số điện thoại",
        address: "Địa chỉ",
        city: "Thành phố",
        country: "Quốc gia",
        save: "Lưu khách hàng"
      },
      delete: {
        title: "Xóa khách hàng",
        confirm: "Bạn có chắc chắn muốn xóa khách hàng này không? Hành động này không thể hoàn tác."
      }
    },
    suppliers: {
      title: "Nhà cung cấp",
      add: "Thêm nhà cung cấp",
      search: "Tìm kiếm nhà cung cấp...",
      noData: "Không tìm thấy nhà cung cấp.",
      createFirst: "Thêm nhà cung cấp đầu tiên",
      form: {
        addTitle: "Thêm nhà cung cấp mới",
        editTitle: "Sửa nhà cung cấp",
        name: "Tên nhà cung cấp",
        namePlaceholder: "VD: Công ty Bột, Cty Đường",
        contactName: "Người liên hệ",
        contactPlaceholder: "Tên người liên hệ",
        phone: "Số điện thoại",
        email: "Email",
        address: "Địa chỉ",
        addressPlaceholder: "Số nhà, đường, thành phố",
        note: "Ghi chú",
        notePlaceholder: "Ghi chú thêm...",
        save: "Lưu nhà cung cấp",
        errors: {
          nameRequired: "Tên nhà cung cấp là bắt buộc",
          saveFailed: "Không thể lưu nhà cung cấp"
        }
      },
      delete: {
        title: "Xóa nhà cung cấp",
        confirm: "Bạn có chắc chắn muốn xóa nhà cung cấp này không? Hành động này không thể hoàn tác."
      },
      table: {
        name: "Nhà cung cấp",
        contact: "Liên hệ",
        actions: "Thao tác"
      }
    },
    users: {
      title: "Quản lý người dùng",
      searchPlaceholder: "Tìm theo tên, email...",
      noUsers: "Không tìm thấy người dùng nào.",
      stats: {
        total: "Tổng người dùng",
        pending: "Chờ phê duyệt",
        active: "Đã kích hoạt",
        inactive: "Đã vô hiệu hóa"
      },
      status: {
        pending: "Chờ phê duyệt",
        active: "Đã kích hoạt",
        inactive: "Đã vô hiệu hóa"
      },
      role: {
        superAdmin: "Super Admin",
        admin: "Admin",
        colaborator: "Cộng tác viên"
      },
      filter: {
        all: "Tất cả trạng thái"
      },
      table: {
        user: "Người dùng",
        customName: "Tên gợi nhớ",
        role: "Vai trò",
        status: "Trạng thái",
        lastLogin: "Đăng nhập cuối",
        actions: "Thao tác"
      },
      actions: {
        approve: "Phê duyệt",
        activate: "Kích hoạt",
        deactivate: "Vô hiệu hóa",
        edit: "Chỉnh sửa",
        cancel: "Hủy",
        save: "Lưu"
      },
      messages: {
        statusUpdated: "Cập nhật trạng thái thành công",
        customNameUpdated: "Cập nhật tên gợi nhớ thành công",
        roleUpdated: "Cập nhật vai trò thành công",
        loadError: "Không thể tải danh sách người dùng",
        updateStatusError: "Không thể cập nhật trạng thái",
        updateCustomNameError: "Không thể cập nhật tên gợi nhớ",
        updateRoleError: "Không thể cập nhật vai trò"
      }
    },
    transactions: {
      title: "Giao dịch",
      searchPlaceholder: "Tìm mã đơn, nội dung...",
      noData: "Chưa có giao dịch nào.",
      table: {
        date: "Ngày",
        amount: "Số tiền",
        orderNumber: "Mã đơn",
        content: "Nội dung",
        gateway: "Cổng TT",
        account: "Tài khoản"
      }
    },
    form: {
      createTitle: "Tạo đơn hàng mới",
      editTitle: "Chỉnh sửa đơn hàng",
      customerDetails: "Thông tin khách hàng",
      customerName: "Tên khách hàng",
      phone: "Số điện thoại",
      address: "Địa chỉ giao hàng",
      orderInfo: "Thông tin đơn hàng",
      productType: "Loại sản phẩm",
      customName: "Tên sản phẩm",
      customPlaceholder: "VD: Bánh kem đặc biệt",
      quantity: "Số lượng",
      unitPrice: "Đơn giá (VND)",
      shippingCost: "Phí vận chuyển (VND)",
      totalEstimate: "Tạm tính",
      status: "Trạng thái",
      note: "Ghi chú",
      cancel: "Hủy bỏ",
      save: "Lưu đơn hàng",
      saving: "Đang lưu...",
      saveProduct: "Lưu sản phẩm"
    },
    detail: {
      orderId: "Đơn hàng #",
      placedOn: "Đặt lúc",
      tabDetails: "Chi tiết đơn",
      tabAi: "Trợ lý AI",
      customer: "Khách hàng",
      shippingAddress: "Địa chỉ nhận hàng",
      items: "Sản phẩm",
      subtotal: "Tiền hàng",
      shipping: "Phí ship",
      total: "Tổng cộng",
      fulfillment: "Vận đơn",
      tracking: "Mã vận đơn",
      payment: "Thanh toán",
      paymentMethod: "Phương thức",
      transactionNumber: "Mã giao dịch",
      notAssigned: "Chưa có",
      note: "Ghi chú",
      noNote: "Không có ghi chú",
      close: "Đóng",
      edit: "Sửa đơn",
      aiIntro: "Sử dụng AI nâng cao để phân tích đơn hàng, soạn email hoặc đánh giá rủi ro ngay lập tức.",
      draftEmail: "Soạn Email",
      riskCheck: "Kiểm tra rủi ro",
      summarize: "Tóm tắt đơn",
      copyClipboard: "Sao chép",
      consulting: "Đang hỏi Gemini..."
    },
    paymentMethod: {
      label: "Phương thức",
      cash: "Tiền mặt",
      banking: "Chuyển khoản"
    },
    qr: {
      sectionTitle: "Mã thanh toán",
      title: "Chuyển khoản (VietQR)",
      bank: "Ngân hàng",
      account: "Số TK",
      accountName: "Tên TK",
      amount: "Số tiền",
      content: "Nội dung",
      instruction: "Quét mã bằng ứng dụng ngân hàng để thanh toán."
    },
    login: {
      welcome: "Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.",
      googleButton: "Đăng nhập bằng Google",
      currentAccount: "Tài khoản hiện tại",
      useCurrentAccount: "Tiếp tục với tài khoản này",
      switchAccount: "Chọn tài khoản khác / Thêm mới",
      recentAccounts: "Tài khoản đã đăng nhập",
      accountRemoved: "Đã xóa tài khoản khỏi danh sách",
      removeAccount: "Xóa tài khoản"
    }
  }
};