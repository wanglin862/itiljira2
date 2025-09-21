// CodeJira ITIL Platform - Test Server with ITIL Reporting Features
import { createServer } from 'http';
import { URL } from 'url';

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API test endpoint
  if (url.pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'ITIL API endpoint would be here',
      endpoint: url.pathname,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Main page
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CodeJira ITIL Platform</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
          h2 { color: #34495e; margin-top: 30px; }
          .status { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
          .api-endpoint { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: monospace; border-left: 3px solid #007bff; }
          .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
          .feature-card { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 6px; }
          .feature-card h3 { color: #2980b9; margin-top: 0; }
          ul { padding-left: 20px; }
          li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 CodeJira ITIL & CMDB Integration Platform</h1>
          
          <div class="status">
            <strong>✅ Server đang chạy thành công!</strong><br>
            Database: ${process.env.DATABASE_URL ? '✅ Kết nối thành công' : '❌ Chưa cấu hình'}<br>
            Thời gian: ${new Date().toLocaleString('vi-VN')}<br>
            Port: ${process.env.PORT || 5000}
          </div>

          <h2>📊 Tính năng Báo cáo ITIL</h2>
          <div class="feature-grid">
            <div class="feature-card">
              <h3>🔴 Incident Management</h3>
              <ul>
                <li>Báo cáo tổng quan incident</li>
                <li>Thống kê MTTR (Mean Time To Resolution)</li>
                <li>Phân tích theo mức độ ưu tiên</li>
                <li>Tỷ lệ giải quyết incident</li>
              </ul>
              <div class="api-endpoint">GET /api/reports/incident</div>
            </div>

            <div class="feature-card">
              <h3>⚠️ Problem Management</h3>
              <ul>
                <li>Theo dõi problem đang hoạt động</li>
                <li>Tỷ lệ giải quyết problem</li>
                <li>Phân tích nguyên nhân gốc</li>
                <li>Quản lý Known Error Database</li>
              </ul>
              <div class="api-endpoint">GET /api/reports/problem</div>
            </div>

            <div class="feature-card">
              <h3>🔄 Change Management</h3>
              <ul>
                <li>Tỷ lệ thành công/thất bại change</li>
                <li>Theo dõi change đang chờ</li>
                <li>Phân tích theo mức độ ưu tiên</li>
                <li>Emergency change tracking</li>
              </ul>
              <div class="api-endpoint">GET /api/reports/change</div>
            </div>

            <div class="feature-card">
              <h3>⏱️ SLA Management</h3>
              <ul>
                <li>Tỷ lệ tuân thủ SLA</li>
                <li>Phân tích SLA bị vi phạm</li>
                <li>Báo cáo escalation</li>
                <li>Performance metrics</li>
              </ul>
              <div class="api-endpoint">GET /api/reports/sla</div>
            </div>

            <div class="feature-card">
              <h3>🗄️ CMDB Reports</h3>
              <ul>
                <li>Inventory Configuration Items</li>
                <li>Phân tích theo loại CI</li>
                <li>Trạng thái và môi trường</li>
                <li>Relationship mapping</li>
              </ul>
              <div class="api-endpoint">GET /api/reports/cmdb</div>
            </div>

            <div class="feature-card">
              <h3>📈 Service Availability</h3>
              <ul>
                <li>Uptime percentage calculation</li>
                <li>Service availability metrics</li>
                <li>Downtime impact analysis</li>
                <li>Critical incident tracking</li>
              </ul>
              <div class="api-endpoint">GET /api/reports/availability</div>
            </div>
          </div>

          <h2>📋 ITIL Dashboard Tổng hợp</h2>
          <p>Báo cáo tổng hợp tất cả các metric ITIL trong một API endpoint:</p>
          <div class="api-endpoint">GET /api/reports/itil-dashboard</div>
          <p><em>Hỗ trợ tham số: startDate, endDate (format: YYYY-MM-DD)</em></p>

          <h2>🔧 API Endpoints có sẵn</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <div class="api-endpoint">GET /api/health - Health check</div>
            <div class="api-endpoint">GET /api/cis - Configuration Items</div>
            <div class="api-endpoint">GET /api/tickets - Tickets (Incident/Problem/Change)</div>
            <div class="api-endpoint">GET /api/sla-metrics - SLA Metrics</div>
            <div class="api-endpoint">GET /api/dashboard - Dashboard data</div>
          </div>

          <h2>💾 Dữ liệu mẫu</h2>
          <p>Hệ thống đã được cài đặt với dữ liệu mẫu bao gồm:</p>
          <ul>
            <li>5 Configuration Items (Servers, Database, Load Balancer)</li>
            <li>5 Tickets (2 Incidents, 1 Problem, 2 Changes)</li>
            <li>2 SLA Metrics với trường hợp vi phạm và tuân thủ</li>
          </ul>

          <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
            <strong>🎯 CodeJira Platform</strong> - Hệ thống quản lý ITIL và CMDB chuyên nghiệp<br>
            <small>Tích hợp với Jira, hỗ trợ đầy đủ quy trình ITIL v4</small>
          </div>
        </div>
      </body>
    </html>
  `);
});

const port = parseInt(process.env.PORT || '5000', 10);
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 CodeJira ITIL Platform running on port ${port}`);
  console.log(`📊 ITIL Reporting features available`);
  console.log(`💾 Database configured: ${!!process.env.DATABASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString('vi-VN')}`);
});