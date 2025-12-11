import { GoogleGenAI } from "@google/genai";
import { Order } from '../types';

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in the environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateOrderAnalysis = async (order: Order, promptType: 'email' | 'risk' | 'summary', language: 'en' | 'vi' = 'en'): Promise<string> => {
  const ai = getClient();
  const errorMsg = language === 'vi' ? "Thiếu API Key. Không thể phân tích." : "API Key missing. Unable to generate analysis.";
  if (!ai) return errorMsg;

  let prompt = "";
  const orderDetails = JSON.stringify(order, null, 2);

  if (language === 'vi') {
      switch (promptType) {
        case 'email':
          prompt = `Bạn là chuyên gia chăm sóc khách hàng. Hãy viết một email chuyên nghiệp, lịch sự gửi tới khách hàng về đơn hàng của họ bằng tiếng Việt.
          Nếu trạng thái là DELIVERED, hãy cảm ơn họ. 
          Nếu SHIPPED, cung cấp thông tin theo dõi. 
          Nếu DELAYED hoặc PENDING trong thời gian dài, hãy xin lỗi một cách chân thành.
          
          Chi tiết đơn hàng:
          ${orderDetails}`;
          break;
        case 'risk':
          prompt = `Phân tích đơn hàng sau đây để tìm rủi ro gian lận tiềm ẩn hoặc các vấn đề thực hiện bằng tiếng Việt.
          Xem xét giá trị đơn hàng, loại mặt hàng và địa chỉ. 
          Trả về điểm đánh giá rủi ro ngắn gọn (Thấp/Trung bình/Cao) và giải thích trong 2 câu.

          Chi tiết đơn hàng:
          ${orderDetails}`;
          break;
        case 'summary':
          prompt = `Tóm tắt đơn hàng này bằng 3 gạch đầu dòng cho đội ngũ vận hành bằng tiếng Việt. Làm nổi bật các mặt hàng giá trị cao hoặc các yêu cầu xử lý đặc biệt nếu thấy rõ.
          
          Chi tiết đơn hàng:
          ${orderDetails}`;
          break;
      }
  } else {
      switch (promptType) {
        case 'email':
          prompt = `You are a customer service expert. Write a professional, empathetic email to the customer regarding their order. 
          If the status is DELIVERED, thank them. 
          If SHIPPED, provide tracking info. 
          If DELAYED or PENDING for a long time, apologize.
          
          Order Details:
          ${orderDetails}`;
          break;
        case 'risk':
          prompt = `Analyze the following order for potential fraud risk or fulfillment issues. 
          Consider the order value, item types, and address. 
          Return a brief risk assessment score (Low/Medium/High) and a 2-sentence explanation.

          Order Details:
          ${orderDetails}`;
          break;
        case 'summary':
          prompt = `Summarize this order in 3 bullet points for the fulfillment team. Highlight high-value items or special handling needs if apparent.
          
          Order Details:
          ${orderDetails}`;
          break;
      }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const defaultError = language === 'vi' ? "Không có phản hồi." : "No response generated.";
    return response.text || defaultError;
  } catch (error) {
    console.error("Gemini API Error:", error);
    const failError = language === 'vi' ? "Không thể tạo nội dung. Vui lòng thử lại." : "Failed to generate content. Please try again.";
    return failError;
  }
};

export const generateDashboardInsights = async (orders: Order[], language: 'en' | 'vi' = 'en'): Promise<string> => {
  const ai = getClient();
  const errorMsg = language === 'vi' ? "Thiếu API Key." : "API Key missing.";
  if (!ai) return errorMsg;

  // Simplify order data to save tokens and focus on metrics
  const summaryData = orders.map(o => ({
    status: o.status,
    total: o.total,
    date: o.date,
    items: o.items.length
  }));

  const dataStr = JSON.stringify(summaryData);
  let prompt = "";

  if (language === 'vi') {
    prompt = `Bạn là một nhà phân tích kinh doanh. Phân tích các đơn hàng gần đây và cung cấp một bản tóm tắt ngắn gọn hàng ngày bằng tiếng Việt.
    1. Xác định bất kỳ xu hướng nào (ví dụ: lượng hủy đơn cao, doanh thu tăng đột biến).
    2. Đề xuất một bước hành động cụ thể cho người quản lý vận hành.
    3. Giữ độ dài dưới 150 từ.
    
    Dữ liệu: ${dataStr}`;
  } else {
    prompt = `You are a business analyst. specific Analyze these recent orders and provide a brief daily briefing.
    1. Identify any trends (e.g. high volume of cancellations, surge in revenue).
    2. Suggest one actionable step for the operations manager.
    3. Keep it under 150 words.
    
    Data: ${dataStr}`;
  }

  try {
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const defaultError = language === 'vi' ? "Không có thông tin chi tiết." : "No insights available.";
    return response.text || defaultError;
  } catch (error) {
    console.error("Gemini Dashboard Error:", error);
    const failError = language === 'vi' ? "Không thể tạo thông tin chi tiết lúc này." : "Unable to generate insights at this time.";
    return failError;
  }
}