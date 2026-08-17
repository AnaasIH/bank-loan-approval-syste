import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import './App.css';

const API_BASE_URL = 'http://localhost:8080/api/loans';

function App() {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer', 'history', 'officer', 'admin'

  // --- Customer Portal ---
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState(50000);
  const [months, setMonths] = useState(24);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Customer History ---
  const [searchName, setSearchName] = useState('');
  const [historyList, setHistoryList] = useState([]);
  const [searchingHistory, setSearchingHistory] = useState(false);

  // --- Officer Portal ---
  const [tasks, setTasks] = useState([]);

  // --- Admin Portal ---
  const [allLoans, setAllLoans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'APPROVED', 'REJECTED', 'PENDING'
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Calculation
  const monthlyInterestRate = 0.05 / 12;
  const estimatedMonthlyPayment = amount > 0 
    ? Math.round((amount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -months)))
    : 0;

  useEffect(() => {
    if (activeTab === 'officer') {
      fetchTasks();
    } else if (activeTab === 'admin') {
      fetchAllLoansForAdmin();
    }
  }, [activeTab]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchAllLoansForAdmin = async () => {
    setLoadingAdmin(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/all-loans`);
      setAllLoans(response.data);
    } catch (error) {
      console.error('Error fetching all loans for admin:', error);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/apply`, {
        customerName: customerName,
        amount: parseFloat(amount),
      });

      const isInstantApproval = amount <= 50000;

      setSubmitMessage({
        type: isInstantApproval ? 'success' : 'warning',
        text: isInstantApproval 
          ? `🎉 تم قبول الطلب فوراً! الرقم المرجعي: ${response.data.processInstanceId}`
          : `⏳ الطلب قيد المراجعة اليدوية. الرقم المرجعي: ${response.data.processInstanceId}`
      });

      setSearchName(customerName);
      setCustomerName('');
    } catch (error) {
      setSubmitMessage({
        type: 'danger',
        text: '❌ تعذر التواصل مع السيرفر. يرجى التأكد من تشغيل الـ Backend.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchHistory = async (e) => {
    if (e) e.preventDefault();
    if (!searchName.trim()) return;

    setSearchingHistory(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/history/${encodeURIComponent(searchName.trim())}`);
      setHistoryList(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setSearchingHistory(false);
    }
  };

  const handleCompleteTask = async (taskId, approved) => {
    try {
      await axios.post(`${API_BASE_URL}/tasks/${taskId}/complete?approved=${approved}`);
      fetchTasks();
    } catch (error) {
      alert('حدث خطأ أثناء معالجة المهمة.');
    }
  };

  // PDF Generation Function
  const downloadPDFNotice = (loan) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // Green color
    doc.text("BankLoan Enterprise - Official Loan Approval", 20, 20);

    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Reference ID: ${loan.processInstanceId}`, 20, 40);
    doc.text(`Customer Name: ${loan.customerName || searchName}`, 20, 50);
    doc.text(`Approved Amount: ${loan.amount ? loan.amount.toLocaleString() : 'N/A'} DH`, 20, 60);
    doc.text(`Date of Approval: ${new Date().toLocaleDateString()}`, 20, 70);
    doc.text(`Status: OFFICIALLY APPROVED`, 20, 80);

    doc.text("Thank you for choosing BankLoan Enterprise.", 20, 110);

    doc.save(`Loan_Approval_${loan.processInstanceId}.pdf`);
  };

  // Admin Calculations
  const totalApproved = allLoans.filter(l => l.status === 'APPROVED').length;
  const totalRejected = allLoans.filter(l => l.status === 'REJECTED').length;
  const totalPending = allLoans.filter(l => l.status === 'PENDING').length;

  const filteredLoans = allLoans.filter(loan => {
    if (statusFilter === 'ALL') return true;
    return loan.status === statusFilter;
  });

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="brand">
          <span className="logo-icon">🏦</span> BankLoan Enterprise
        </div>
        <div className="nav-links">
          <button 
            className={`nav-btn ${activeTab === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            👤 تقديم طلب
          </button>
          <button 
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📋 سجل طلباتي
          </button>
          <button 
            className={`nav-btn ${activeTab === 'officer' ? 'active' : ''}`}
            onClick={() => setActiveTab('officer')}
          >
            🛡️ المراجعة اليدوية
            {tasks.length > 0 && <span className="badge">{tasks.length}</span>}
          </button>
          <button 
            className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            📊 لوحة الإدارة (Admin)
          </button>
        </div>
      </nav>

      <main className="main-content">
        {/* ==================== 1. APPLY LOAN ==================== */}
        {activeTab === 'customer' && (
          <div className="portal-container animate-fade">
            <div className="portal-header">
              <h2>تقديم طلب قرض جديد</h2>
              <p>قم بحساب القسط المناسب لك وتقديم الطلب في دقائق معدودة.</p>
            </div>

            <div className="grid-2">
              <div className="card">
                <h3>معلومات الطلب</h3>
                <form onSubmit={handleApplyLoan}>
                  <div className="form-group">
                    <label>الاسم الكامل:</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="أدخل اسم العميل"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>مبلغ القرض المطلوب: <strong>{amount.toLocaleString()} DH</strong></label>
                    <input
                      type="range"
                      min="5000"
                      max="200000"
                      step="5000"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>مدة السداد: <strong>{months} شهراً</strong></label>
                    <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                      <option value={12}>12 شهراً</option>
                      <option value={24}>24 شهراً</option>
                      <option value={36}>36 شهراً</option>
                      <option value={48}>48 شهراً</option>
                      <option value={60}>60 شهراً</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'جاري معالجة الطلب...' : 'تأكيد وتقديم الطلب 🚀'}
                  </button>
                </form>

                {submitMessage && (
                  <div className={`alert alert-${submitMessage.type}`}>
                    {submitMessage.text}
                  </div>
                )}
              </div>

              <div className="card summary-card">
                <h3>ملخص القرض التقديري</h3>
                <div className="summary-item">
                  <span>المبلغ الإجمالي:</span>
                  <strong>{amount.toLocaleString()} DH</strong>
                </div>
                <div className="summary-item">
                  <span>مدة التمويل:</span>
                  <strong>{months} شهراً</strong>
                </div>
                <div className="summary-item highlight">
                  <span>القسط الشهري المتوقع:</span>
                  <strong className="price">{estimatedMonthlyPayment.toLocaleString()} DH / شهر</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. CUSTOMER HISTORY ==================== */}
        {activeTab === 'history' && (
          <div className="portal-container animate-fade">
            <div className="portal-header">
              <h2>تتبع وسجل طلباتك السابقة</h2>
            </div>

            <div className="card search-card">
              <form onSubmit={handleFetchHistory} className="search-box">
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="أدخل اسمك لاسترجاع سجل قروضك..."
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={searchingHistory}>
                  {searchingHistory ? 'جاري البحث...' : '🔍 بحث'}
                </button>
              </form>
            </div>

            <div className="card mt-4">
              <h3>نتائج السجل التاريخي</h3>
              {historyList.length === 0 ? (
                <div className="empty-state"><p>لا توجد نتائج للعرض.</p></div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>رقم العملية المرجعي</th>
                      <th>تاريخ التقديم</th>
                      <th>المبلغ المطلوب</th>
                      <th>حالة الطلب الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((item) => (
                      <tr key={item.processInstanceId}>
                        <td><code>{item.processInstanceId}</code></td>
                        <td>{new Date(item.startTime).toLocaleString('ar-MA')}</td>
                        <td><strong>{item.amount ? `${item.amount.toLocaleString()} DH` : 'N/A'}</strong></td>
                        <td>
                          {item.status === 'APPROVED' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className="status-badge status-approved">✅ مقبول</span>
                              <button 
                                onClick={() => downloadPDFNotice(item)} 
                                className="btn btn-sm btn-outline"
                              >
                                📄 وثيقة القبول (PDF)
                              </button>
                            </div>
                          )}
                          {item.status === 'PENDING' && <span className="status-badge status-pending">⏳ قيد المراجعة</span>}
                          {item.status === 'REJECTED' && <span className="status-badge status-rejected">❌ مرفوض</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ==================== 3. OFFICER PORTAL ==================== */}
        {activeTab === 'officer' && (
          <div className="portal-container animate-fade">
            <div className="portal-header flex-between">
              <div>
                <h2>لوحة مراجعة المهام المعلقة</h2>
              </div>
              <button onClick={fetchTasks} className="btn btn-outline">🔄 تحديث</button>
            </div>

            <div className="card">
              <h3>قائمة المهام المنتظرة</h3>
              {tasks.length === 0 ? (
                <div className="empty-state"><p>✨ لا توجد مهام معلقة حالياً.</p></div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>معرف المهمة</th>
                      <th>اسم العميل</th>
                      <th>المبلغ المطلوب</th>
                      <th>الإجراء المطلوب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.taskId}>
                        <td><code>{task.taskId}</code></td>
                        <td><strong>{task.customerName || 'غير محدد'}</strong></td>
                        <td><span className="amount-badge">{task.amount ? `${task.amount.toLocaleString()} DH` : 'N/A'}</span></td>
                        <td>
                          <button 
                            onClick={() => handleCompleteTask(task.taskId, true)}
                            className="btn btn-sm btn-success mr-2"
                          >
                            موافقة ✅
                          </button>
                          <button 
                            onClick={() => handleCompleteTask(task.taskId, false)}
                            className="btn btn-sm btn-danger"
                          >
                            رفض ❌
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ==================== 4. ADMIN DASHBOARD ==================== */}
        {activeTab === 'admin' && (
          <div className="portal-container animate-fade">
            <div className="portal-header flex-between">
              <div>
                <h2>📊 لوحة الإدارة العامة (Admin Dashboard)</h2>
                <p>مراقبة واستعراض كافة الطلبات للعملاء الحالية والسابقة ومعرفة القرارات المتخذة.</p>
              </div>
              <button onClick={fetchAllLoansForAdmin} className="btn btn-outline">🔄 تحديث البيانات</button>
            </div>

            {/* General Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <h4>إجمالي الطلبات</h4>
                <div className="stat-value">{allLoans.length}</div>
              </div>
              <div className="stat-card">
                <h4>الطلبات المقبولة</h4>
                <div className="stat-value text-success">✅ {totalApproved}</div>
              </div>
              <div className="stat-card">
                <h4>الطلبات المرفوضة</h4>
                <div className="stat-value text-danger">❌ {totalRejected}</div>
              </div>
              <div className="stat-card">
                <h4>قيد الانتظار</h4>
                <div className="stat-value text-warning">⏳ {totalPending}</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="card mt-4 mb-4">
              <h3>📊 التحليلات والرسوم البيانية للطلبات</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'مقبول (Approved)', value: totalApproved, color: '#10b981' },
                        { name: 'مرفوض (Rejected)', value: totalRejected, color: '#ef4444' },
                        { name: 'قيد الانتظار (Pending)', value: totalPending, color: '#f59e0b' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell key="cell-approved" fill="#10b981" />
                      <Cell key="cell-rejected" fill="#ef4444" />
                      <Cell key="cell-pending" fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Admin Table with Filters */}
            <div className="card mt-4">
              <div className="card-header flex-between mb-3">
                <h3>سجل الطلبات الكلي</h3>
                <div className="filter-buttons">
                  <button 
                    className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setStatusFilter('ALL')}
                  >الكل ({allLoans.length})</button>
                  <button 
                    className={`btn btn-sm ${statusFilter === 'APPROVED' ? 'btn-success' : 'btn-outline'}`}
                    onClick={() => setStatusFilter('APPROVED')}
                  >المقبولة ({totalApproved})</button>
                  <button 
                    className={`btn btn-sm ${statusFilter === 'REJECTED' ? 'btn-danger' : 'btn-outline'}`}
                    onClick={() => setStatusFilter('REJECTED')}
                  >المرفوضة ({totalRejected})</button>
                  <button 
                    className={`btn btn-sm ${statusFilter === 'PENDING' ? 'btn-warning' : 'btn-outline'}`}
                    onClick={() => setStatusFilter('PENDING')}
                  >قيد الانتظار ({totalPending})</button>
                </div>
              </div>

              {loadingAdmin ? (
                <p className="text-center">جاري تحميل كافة البيانات من القاعدة...</p>
              ) : filteredLoans.length === 0 ? (
                <div className="empty-state"><p>لا توجد طلبات تطابق هذا الفلتر.</p></div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>معرف العملية</th>
                      <th>اسم العميل</th>
                      <th>المبلغ المطلوب</th>
                      <th>تاريخ التقديم</th>
                      <th>حالة القرار النهائي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan) => (
                      <tr key={loan.processInstanceId}>
                        <td><code>{loan.processInstanceId}</code></td>
                        <td><strong>{loan.customerName}</strong></td>
                        <td><strong>{loan.amount ? `${loan.amount.toLocaleString()} DH` : 'N/A'}</strong></td>
                        <td>{new Date(loan.startTime).toLocaleString('ar-MA')}</td>
                        <td>
                          {loan.status === 'APPROVED' && <span className="status-badge status-approved">✅ مقبول (Approved)</span>}
                          {loan.status === 'PENDING' && <span className="status-badge status-pending">⏳ قيد الانتظار (Pending)</span>}
                          {loan.status === 'REJECTED' && <span className="status-badge status-rejected">❌ مرفوض (Rejected)</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;