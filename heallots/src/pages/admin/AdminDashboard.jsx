<link rel="stylesheet" href="style.css"></link>
function AdminDashboard() {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Admin</h2>
        <ul>
          <li>Dashboard</li>
          <li>Appointments</li>
          <li>Settings</li>
        </ul>
      </aside>

      <section className="dashboard-content page-center">
        <h2>Admin Dashboard</h2>

        <div className="card" style={{ marginTop: 20 }}>
          <p><strong>Patient:</strong> Maria Santos</p>
          <p><strong>Service:</strong> Dental</p>
          <p><strong>Date:</strong> 2026-02-16</p>

          <button>Approve</button>
          <button>Cancel</button>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;