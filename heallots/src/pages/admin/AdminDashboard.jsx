import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const statusStyle = {
  Pending:   { bg: '#fef3c7', color: '#b45309', dot: '#d97706' },
  Approved:  { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  Done:      { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  Cancelled: { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
  'Rescheduled by Patient': { bg: '#e0e7ff', color: '#4f46e5', dot: '#6366f1' },
  'Canceled by Patient': { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
};

const serviceEmoji = {
  'Traditional Hilot':  '🤲🏻',
  'Herbal Compress':    '🌿',
  'Head & Neck Relief': '💆🏻‍♀️',
  'Foot Reflexology':   '🦶🏼',
  'Hot Oil Massage':    '🫙',
  'Whole-Body Hilot':   '🧘🏻',
};

export default function AdminDashboard({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchUsers, setSearchUsers] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [reschedulingDate, setReschedulingDate] = useState('');
  const [reschedulingTime, setReschedulingTime] = useState('');
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [confirmMarkAsApproved, setConfirmMarkAsApproved] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  const timeSlots = {
    morning: ['08:00', '09:00', '10:00', '11:00', '12:00'],
    afternoon: ['13:00', '14:00', '15:00', '16:00', '17:00']
  };

  const formatTimeSlot = (time) => {
    const [hour, min] = time.split(':');
    const h = parseInt(hour);
    const meridiem = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${min} ${meridiem}`;
  };

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const calendarDays = [];
    
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
    
    return calendarDays;
  };

  const raw  = localStorage.getItem('user');
  const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Admin';
  const getPhotoKey = () => `userPhoto_${user?.id}`;
  const buildPhotoUrl = (val) => {
    if (!val) return null;
    if (val.startsWith('data:') || val.startsWith('http')) return val;
    if (val.startsWith('/uploads/')) return 'http://localhost:8080/api/user/profile-picture/' + val.split('/').pop();
    return 'http://localhost:8080/api/user/profile-picture/' + val;
  };
  const photo = (() => {
    const stored = localStorage.getItem(getPhotoKey());
    const fromDb = user?.profilePictureUrl;
    if (stored && stored.startsWith('http')) return stored;
    const built = buildPhotoUrl(fromDb);
    if (built) localStorage.setItem(getPhotoKey(), built);
    return built || stored || null;
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (setIsLoggedIn) setIsLoggedIn(false);
    navigate('/', { replace: true });
    window.location.reload();
  };

  // Fetch appointments from backend
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/appointments/all', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Transform backend data to match UI format
        const transformedAppointments = response.data.map(appt => {
          console.log('Appointment data:', appt); // Debug log
          return {
            id: appt.id,
            patient: appt.patientName,
            service: appt.serviceName,
            specialist: appt.specialistName,
            date: appt.appointmentDate,
            time: appt.timeSlot,
            status: appt.status,
            reason: appt.reason || 'N/A',
            notes: appt.notes || '',
            rescheduleReason: appt.rescheduleReason || '',
            cancellationReason: appt.cancellationReason || '',
          };
        });
        
        setAppointments(transformedAppointments);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        // Keep empty array if fetch fails
      }
    };
    
    fetchAppointments();
  }, []);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/user/all', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Transform backend data to match UI format
        const transformedUsers = response.data.map((user, idx) => ({
          id: idx + 1,
          name: user.fullName,
          email: user.email,
          role: user.role || 'USER',
          phone: user.phone || 'N/A',
          joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
        }));
        
        setUsers(transformedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        // Keep empty array if fetch fails
      }
    };
    
    fetchUsers();
  }, []);

  const handleStatus = (id, newStatus) => {
    // Update UI immediately
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    
    // Also update backend
    const updateBackend = async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:8080/api/appointments/${id}/status`, 
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Show success notification
        if (newStatus === 'Approved') {
          showNotification('Appointment approved successfully ✓', 'success');
        } else if (newStatus === 'Cancelled') {
          showNotification('Appointment rejected successfully ✕', 'success');
        } else {
          showNotification(`Status updated to ${newStatus}`, 'success');
        }
      } catch (err) {
        console.error('Error updating appointment status:', err);
        showNotification('Failed to update appointment status', 'error');
        // Revert UI change on error
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: prev.find(x => x.id === id)?.status } : a));
      }
    };
    
    updateBackend();
  };

  // Helper function to check if appointment is at least 24 hours away
  const canModifyAppointment = (dateString, timeString) => {
    try {
      const now = new Date();
      const appointmentDateParts = dateString.split(',').map(p => p.trim());
      const monthYear = appointmentDateParts[0];
      const day = appointmentDateParts[1]?.split(' ')[0];
      if (!day || !monthYear) return false;
      
      const [monthName, year] = monthYear.split(' ');
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const monthIndex = months.indexOf(monthName);
      
      const hour = parseInt(timeString.split(':')[0]);
      const isPM = timeString.includes('PM') && hour !== 12;
      const isAM = timeString.includes('AM') && hour === 12;
      const adjustedHour = isPM ? hour + 12 : isAM ? 0 : hour;
      
      const appointmentDate = new Date(year, monthIndex, day, adjustedHour, 0, 0);
      const timeDifference = appointmentDate - now;
      const hoursLeft = timeDifference / (1000 * 60 * 60);
      
      return hoursLeft >= 24;
    } catch (e) {
      return false;
    }
  };

  const openModal = (appt) => {
    const apptWithDetails = {
      ...appt,
      userEmail: users.find(u => u.name === appt.patient)?.email || 'N/A',
      userPhone: users.find(u => u.name === appt.patient)?.phone || 'N/A'
    };
    setSelectedAppt(apptWithDetails);
    setModalOpen(true);
    setRescheduleMode(false);
    setShowConfirmCancel(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAppt(null);
    setRescheduleMode(false);
    setShowConfirmCancel(false);
    setConfirmMarkAsApproved(false);
    setReschedulingDate('');
    setReschedulingTime('');
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppt) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/appointments/${selectedAppt.id}/status`,
        { status: 'Cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setAppointments(prev =>
        prev.map(a => a.id === selectedAppt.id ? { ...a, status: 'Cancelled' } : a)
      );

      closeModal();
      showNotification('Appointment cancelled successfully', 'success');
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      showNotification('Failed to cancel appointment', 'error');
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedAppt || !reschedulingDate || !reschedulingTime) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/appointments/${selectedAppt.id}`,
        { 
          appointmentDate: reschedulingDate,
          timeSlot: reschedulingTime,
          rescheduleReason: '',
          status: 'Approved'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setAppointments(prev =>
        prev.map(a => a.id === selectedAppt.id 
          ? { ...a, date: reschedulingDate, time: reschedulingTime, status: 'Approved' } 
          : a
        )
      );

      closeModal();
      showNotification('Appointment rescheduled successfully', 'success');
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      showNotification('Failed to reschedule appointment', 'error');
    }
  };

  const handleMarkAsDone = async () => {
    if (!selectedAppt) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/appointments/${selectedAppt.id}/status`,
        { status: 'Done' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setAppointments(prev =>
        prev.map(a => a.id === selectedAppt.id ? { ...a, status: 'Done' } : a)
      );

      closeModal();
      showNotification('Appointment marked as done successfully', 'success');
    } catch (err) {
      console.error('Error marking appointment as done:', err);
      showNotification('Failed to mark appointment as done', 'error');
    }
  };

  const filteredAppts = appointments.filter(a => {
    const matchSearch = search === '' ||
      a.patient.toLowerCase().includes(search.toLowerCase()) ||
      a.specialist.toLowerCase().includes(search.toLowerCase()) ||
      a.service.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredUsers = users.filter(u => {
    const matchSearch = searchUsers === '' ||
      u.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.phone.toLowerCase().includes(searchUsers.toLowerCase());
    const matchRole = filterRole === 'All' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = [
    { label: 'Total Appointments',     value: appointments.length,                                        icon: '📋', bg: '#fef3c7', accent: '#d97706' },
    { label: 'Pending Appointments',   value: appointments.filter(a => a.status === 'Pending').length,    icon: '⏳', bg: '#fef9c3', accent: '#ca8a04' },
    { label: 'Approved Appointments',  value: appointments.filter(a => a.status === 'Approved').length,   icon: '✅', bg: '#dcfce7', accent: '#16a34a' },
    { label: 'Patients',  value: users.filter(u => u.role === 'USER').length,            icon: '👥', bg: '#e0f2fe', accent: '#0284c7' },
  ];

  const navItems = [
    { id: 'overview',     label: 'Admin Panel',      icon: '👨🏻‍💻' },
    { id: 'appointments', label: 'Appointments',   icon: '📋' },
    { id: 'patients',     label: 'Patients',       icon: '👥' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ad-layout { min-height: 100vh; background: #f4f1ec; font-family: 'DM Sans', sans-serif; color: #1c1408; display: flex; flex-direction: column; }

        /* ── TOPBAR ── */
        .ad-topbar {
          background: linear-gradient(135deg, #0f172a 0%, #1c1408 100%);
          border-bottom: 1px solid rgba(217,119,6,0.25);
          padding: 0 28px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100; flex-shrink: 0;
        }
        .ad-topbar-left  { display: flex; align-items: center; gap: 14px; }
        .ad-topbar-brand { display: flex; align-items: center; cursor: pointer; }
        .ad-topbar-logo  { height: 55px; width: auto; filter: brightness(0) invert(1) drop-shadow(0 0 5px rgba(217,119,6,0.5)); }
        .ad-admin-chip {
          background: linear-gradient(135deg, rgba(217,119,6,0.25), rgba(180,83,9,0.2));
          border: 1px solid rgba(217,119,6,0.4);
          color: #fbbf24; font-size: 10px; font-weight: 800;
          padding: 3px 10px; border-radius: 100px;
          letter-spacing: 1.2px; text-transform: uppercase;
        }
        .ad-topbar-right { display: flex; align-items: center; gap: 14px; }
        .ad-user-pill    { display: flex; align-items: center; gap: 10px; }
        .ad-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #d97706, #b45309);
          border-radius: 50%; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #fff;
          box-shadow: 0 2px 8px rgba(217,119,6,0.45);
          cursor: pointer;
          transition: all 0.2s;
        }
        .ad-avatar:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(217,119,6,0.6); }
        .ad-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .ad-user-info   { line-height: 1.25; }
        .ad-user-name   { font-size: 13px; font-weight: 600; color: #e2c98a; }
        .ad-user-role   { font-size: 10px; color: #d97706; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; }
        .ad-logout-btn {
          background: rgba(217,119,6,0.12); border: 1px solid rgba(217,119,6,0.3);
          color: #fbbf24; border-radius: 8px; padding: 7px 16px;
          font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.18s;
        }
        .ad-logout-btn:hover { background: rgba(217,119,6,0.22); border-color: rgba(217,119,6,0.5); }

        /* ── BODY ── */
        .ad-body { display: flex; flex: 1; min-height: 0; }

        /* ── SIDEBAR ── */
        .ad-sidebar {
          width: 210px; flex-shrink: 0;
          background: #fff;
          border-right: 1.5px solid #ede3d6;
          padding: 20px 10px;
          display: flex; flex-direction: column; gap: 3px;
        }
        .ad-sidebar-section {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.4px; color: #c4a96b;
          padding: 0 10px; margin: 10px 0 6px;
        }
        .ad-nav-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 10px 12px; border-radius: 10px;
          border: none; background: transparent;
          font-size: 14px; font-weight: 500; color: #6b5a4e;
          cursor: pointer; transition: all 0.18s; text-align: left;
          font-family: 'DM Sans', sans-serif;
        }
        .ad-nav-btn:hover  { background: #fef3c7; color: #92400e; }
        .ad-nav-btn.active { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; font-weight: 700; box-shadow: 0 2px 8px rgba(217,119,6,0.15); }
        .ad-nav-icon { font-size: 16px; width: 22px; text-align: center; }

        /* ── MAIN ── */
        .ad-main { flex: 1; padding: 28px 28px 48px; overflow-y: auto; }

        /* ── PAGE HEADER ── */
        .ad-page-header { margin-bottom: 24px; }
        .ad-page-header h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(22px, 2.5vw, 28px);
          font-weight: 900; color: #1c1408; line-height: 1.1; margin-bottom: 4px;
        }
        .ad-page-header p { font-size: 14px; color: #9b8878; font-weight: 300; }

        /* ── STAT CARDS ── */
        .ad-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .ad-stat {
          background: #fff; border: 1.5px solid #ede3d6; border-radius: 16px;
          padding: 18px 20px; display: flex; align-items: center; gap: 14px;
          transition: all 0.2s; position: relative; overflow: hidden;
        }
        .ad-stat::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          border-radius: 16px 16px 0 0;
        }
        .ad-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
        .ad-stat-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .ad-stat-val  { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 900; line-height: 1; margin-bottom: 2px; }
        .ad-stat-lbl  { font-size: 12px; color: #9b8878; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── CARD ── */
        .ad-card { background: #fff; border: 1.5px solid #ede3d6; border-radius: 18px; overflow: hidden; margin-bottom: 20px; }
        .ad-card-head {
          padding: 18px 22px 14px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #f5ede0;
        }
        .ad-card-title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; color: #1c1408; }
        .ad-card-count { font-size: 12px; color: #a8956b; font-weight: 600; background: #fef3c7; padding: 3px 10px; border-radius: 100px; }

        /* ── FILTERS ── */
        .ad-filters { display: flex; gap: 10px; padding: 14px 22px; border-bottom: 1px solid #f5ede0; flex-wrap: wrap; }
        .ad-search {
          flex: 1; min-width: 200px;
          padding: 9px 14px; border: 1.5px solid #e8ddd0; border-radius: 9px;
          font-size: 13px; font-family: 'DM Sans', sans-serif; color: #1c1408;
          background: #fafaf8; outline: none; transition: border-color 0.18s;
        }
        .ad-search:focus { border-color: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.1); }
        .ad-filter-select {
          padding: 9px 32px 9px 12px; border: 1.5px solid #e8ddd0; border-radius: 9px;
          font-size: 13px; font-family: 'DM Sans', sans-serif; color: #1c1408;
          background: #fafaf8 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a8956b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
          appearance: none; outline: none; cursor: pointer; transition: border-color 0.18s;
        }
        .ad-filter-select:focus { border-color: #d97706; }

        /* ── TABLE ── */
        .ad-table { width: 100%; border-collapse: collapse; }
        .ad-table th {
          text-align: left; padding: 11px 22px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
          color: #a8956b; background: #fafaf8; border-bottom: 1px solid #ede3d6;
          white-space: nowrap;
        }
        .ad-table td {
          padding: 14px 22px; font-size: 14px; color: #1c1408;
          border-bottom: 1px solid #f5ede0; vertical-align: middle;
        }
        .ad-table tr:last-child td { border-bottom: none; }
        .ad-table tr:hover td { background: #fffbf5; }
        .ad-table .sub { font-size: 12px; color: #9b8878; margin-top: 2px; }

        /* ── SERVICE CELL ── */
        .ad-service-cell { display: flex; align-items: center; gap: 10px; }
        .ad-service-emoji {
          width: 36px; height: 36px; border-radius: 9px;
          background: #fef3c7; display: flex; align-items: center;
          justify-content: center; font-size: 18px; flex-shrink: 0;
        }

        /* ── STATUS BADGE ── */
        .ad-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px; white-space: nowrap; }
        .ad-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── ACTION BTNS ── */
        .ad-actions { display: flex; gap: 6px; }
        .ad-btn-approve { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; border-radius: 7px; padding: 5px 11px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
        .ad-btn-approve:hover { background: #bbf7d0; transform: translateY(-1px); }
        .ad-btn-reject  { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; border-radius: 7px; padding: 5px 11px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
        .ad-btn-reject:hover { background: #fecaca; transform: translateY(-1px); }

        /* ── ROLE BADGES ── */
        .ad-role-admin { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 6px; padding: 3px 9px; font-size: 11px; font-weight: 700; }
        .ad-role-user  { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; border-radius: 6px; padding: 3px 9px; font-size: 11px; font-weight: 700; }

        /* ── EMPTY STATE ── */
        .ad-empty { text-align: center; padding: 48px 24px; color: #a8956b; }
        .ad-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .ad-empty p { font-size: 14px; }

        /* ── VIEW ALL LINK ── */
        .ad-view-all { font-size: 13px; font-weight: 600; color: #d97706; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.15s; padding: 0; }
        .ad-view-all:hover { color: #b45309; }

        /* ── MODAL ── */
        .ad-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }
        .ad-modal {
          background: #fff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ad-modal-close {
          position: absolute; top: 16px; right: 16px;
          background: transparent; border: none; font-size: 24px;
          cursor: pointer; color: #a8956b; transition: color 0.15s;
        }
        .ad-modal-close:hover { color: #1c1408; }
        .ad-modal-header {
          padding: 24px 24px 16px; border-bottom: 1px solid #ede3d6;
          display: flex; align-items: center; justify-content: space-between;
          position: relative;
        }
        .ad-modal-title {
          font-family: 'Fraunces', serif; font-size: 20px; font-weight: 900;
          color: #1c1408;
        }
        .ad-modal-body {
          padding: 24px;
        }
        .ad-detail-row {
          margin-bottom: 16px;
        }
        .ad-detail-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
          color: #a8956b; margin-bottom: 4px;
        }
        .ad-detail-value {
          font-size: 14px; color: #1c1408; font-weight: 500;
        }
        .ad-detail-divider {
          height: 1px; background: #ede3d6; margin: 16px 0;
        }
        .ad-input-group {
          margin-bottom: 14px;
        }
        .ad-input-label {
          display: block; font-size: 12px; font-weight: 600; color: #1c1408;
          margin-bottom: 6px;
        }
        .ad-input-field {
          width: 100%; padding: 10px 12px; border: 1.5px solid #e8ddd0;
          border-radius: 9px; font-size: 13px; font-family: 'DM Sans', sans-serif;
          color: #1c1408; background: #fafaf8; outline: none;
          transition: border-color 0.18s;
        }
        .ad-input-field:focus {
          border-color: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.1);
        }
        .ad-modal-actions {
          padding: 18px 24px; border-top: 1px solid #ede3d6;
          display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;
        }
        .ad-btn-primary {
          background: linear-gradient(135deg, #f6aa28, #b45309);
          color: #fff; border: none; border-radius: 9px; padding: 9px 18px;
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .ad-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(217,119,6,0.3); }
        .ad-btn-secondary {
          background: #f3f0eb; color: #1c1408; border: 1.5px solid #e8ddd0;
          border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .ad-btn-secondary:hover { background: #ede3d6; }
        .ad-btn-danger {
          background: #b0bd5b; color: #ffffff; border: 1.5px solid #aae520;
          border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .ad-btn-danger:hover { background: #ca5a5a; }

        /* ── CONFIRM DIALOG ── */
        .ad-confirm-dialog {
          background: #fff; border-radius: 16px; padding: 28px; max-width: 400px;
          text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.3s ease-out;
        }
        .ad-confirm-icon {
          font-size: 48px; margin-bottom: 16px;
        }
        .ad-confirm-title {
          font-family: 'Fraunces', serif; font-size: 18px; font-weight: 900;
          color: #1c1408; margin-bottom: 8px;
        }
        .ad-confirm-message {
          font-size: 13px; color: #9b8878; margin-bottom: 24px; line-height: 1.5;
        }
        .ad-confirm-actions {
          display: flex; gap: 10px; justify-content: center;
        }

        @media (max-width: 900px) {
          .ad-stats   { grid-template-columns: repeat(2, 1fr); }
          .ad-sidebar { display: none; }
          .ad-main    { padding: 20px 16px; }
        }

        /* ── NOTIFICATION ── */
        .ad-notification {
          position: fixed;
          top: 75px;
          right: 20px;
          max-width: 400px;
          padding: 16px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 2000;
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .ad-notification.success {
          background: #51f88b;
          color: #0f582a;
          border: 1.5px solid #bbf7d0;
        }

        .ad-notification.error {
          background: #c4f367;
          color: #dc2626;
          border: 1.5px solid #fecaca;
        }

        .ad-notification.info {
          background: #e0f2fe;
          color: #0369a1;
          border: 1.5px solid #bae6fd;
        }

        .ad-notification-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .ad-notification-message {
          flex: 1;
        }

        @media (max-width: 640px) {
          .ad-notification {
            left: 12px;
            right: 12px;
            max-width: none;
          }
        }
      `}</style>

      <div className="ad-layout">

        {/* ── NOTIFICATION ── */}
        {notification && (
          <div className={`ad-notification ${notification.type}`}>
            <span className="ad-notification-icon">
              {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <div className="ad-notification-message">{notification.message}</div>
          </div>
        )}

        {/* ── TOPBAR ── */}
        <div className="ad-topbar">
          <div className="ad-topbar-left">
            <div className="ad-topbar-brand" onClick={() => navigate('/admin')}>
              <img src="/logo.png" alt="Heal Lots" className="ad-topbar-logo" />
            </div>
            <span className="ad-admin-chip">Admin</span>
          </div>
          <div className="ad-topbar-right">
            <div className="ad-user-pill">
              <div className="ad-avatar" onClick={() => navigate('/profile')} title="View Profile">
                {photo ? <img src={photo} alt="Profile" /> : displayName.charAt(0).toUpperCase()}
              </div>
              <div className="ad-user-info">
                <div className="ad-user-name">{displayName}</div>
                <div className="ad-user-role">Admin</div>
              </div>
            </div>
            <button className="ad-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="ad-body">

          {/* ── SIDEBAR ── */}
          <aside className="ad-sidebar">
            <div className="ad-sidebar-section">Menu</div>
            {navItems.map(item => (
              <button key={item.id} className={`ad-nav-btn${tab === item.id ? ' active' : ''}`} onClick={() => setTab(item.id)}>
                <span className="ad-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </aside>

          {/* ── MAIN ── */}
          <main className="ad-main">

            {/* ══ OVERVIEW ══ */}
            {tab === 'overview' && (
              <>
                <div className="ad-page-header">
                  <h1>Overview</h1>
                  <p>Welcome back, {displayName.split(' ')[0]}. Here's a summary of today's activity.</p>
                </div>

                <div className="ad-stats">
                  {stats.map(s => (
                    <div className="ad-stat" key={s.label} style={{'--accent': s.accent}}>
                      <div className="ad-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                      <div>
                        <div className="ad-stat-val" style={{ color: s.accent }}>{s.value}</div>
                        <div className="ad-stat-lbl">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ad-card">
                  <div className="ad-card-head">
                    <div className="ad-card-title">Recent Appointments Booked</div>
                    <button className="ad-view-all" onClick={() => setTab('appointments')}>View all →</button>
                  </div>
                  <table className="ad-table">
                    <thead><tr>
                      <th>Patient</th><th>Service</th><th>Specialist</th>
                      <th>Date & Time</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                      {appointments.slice(0, 4).map(a => {
                        const st = statusStyle[a.status];
                        return (
                          <tr key={a.id}>
                            <td><strong>{a.patient}</strong></td>
                            <td>
                              <div className="ad-service-cell">
                                <div className="ad-service-emoji">{serviceEmoji[a.service] || '🤲'}</div>
                                <span>{a.service}</span>
                              </div>
                            </td>
                            <td><span style={{ color: '#78716c' }}>{a.specialist}</span></td>
                            <td><span style={{ color: '#78716c' }}>{a.date}<br/><span className="sub">{a.time}</span></span></td>
                            <td>
                              <span className="ad-badge" style={{ background: st.bg, color: st.color }}>
                                <span className="ad-dot" style={{ background: st.dot }} />{a.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="ad-view-all" onClick={() => openModal(a)} style={{ fontSize: '12px', fontWeight: 700 }}>View Details</button>
                                {(a.status === 'Pending' || a.status === 'Rescheduled by Patient') && (
                                  <>
                                    <button className="ad-btn-approve" onClick={() => handleStatus(a.id, 'Approved')}>✓ Approve</button>
                                    <button className="ad-btn-reject" onClick={() => {openModal(a); setShowConfirmCancel(true);}}>✕ Reject</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ══ APPOINTMENTS ══ */}
            {tab === 'appointments' && (
              <>
                <div className="ad-page-header">
                  <h1>Appointments</h1>
                  <p>Review, approve, or reject patient appointment requests.</p>
                </div>

                <div className="ad-card">
                  <div className="ad-card-head">
                    <div className="ad-card-title">All Appointments</div>
                    <span className="ad-card-count">{filteredAppts.length} result{filteredAppts.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Filters */}
                  <div className="ad-filters">
                    <input
                      className="ad-search"
                      placeholder="🔍  Search patient, specialist, service..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <select
                      className="ad-filter-select"
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Rescheduled by Patient">Rescheduled by Patient</option>
                      <option value="Approved">Approved</option>
                      <option value="Done">Done</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {filteredAppts.length === 0 ? (
                    <div className="ad-empty">
                      <div className="ad-empty-icon">🔍</div>
                      <p>No appointments match your search.</p>
                    </div>
                  ) : (
                    <table className="ad-table">
                      <thead><tr>
                        <th>Patient</th><th>Service</th><th>Specialist</th>
                        <th>Date & Time</th><th>Status</th><th>Actions</th>
                      </tr></thead>
                      <tbody>
                        {filteredAppts.map(a => {
                          const st = statusStyle[a.status];
                          return (
                            <tr key={a.id}>
                              <td><strong>{a.patient}</strong></td>
                              <td>
                                <div className="ad-service-cell">
                                  <div className="ad-service-emoji">{serviceEmoji[a.service] || '🤲'}</div>
                                  <span>{a.service}</span>
                                </div>
                              </td>
                              <td><span style={{ color: '#78716c' }}>{a.specialist}</span></td>
                              <td><span style={{ color: '#78716c' }}>{a.date}<br/><span className="sub">{a.time}</span></span></td>
                              <td>
                                <span className="ad-badge" style={{ background: st.bg, color: st.color }}>
                                  <span className="ad-dot" style={{ background: st.dot }} />{a.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="ad-view-all" onClick={() => openModal(a)} style={{ fontSize: '12px', fontWeight: 700 }}>View Details</button>
                                  {(a.status === 'Pending' || a.status === 'Rescheduled by Patient') && (
                                    <>
                                      <button className="ad-btn-approve" onClick={() => handleStatus(a.id, 'Approved')}>✓ Approve</button>
                                      <button className="ad-btn-reject" onClick={() => {openModal(a); setShowConfirmCancel(true);}}>✕ Reject</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* ══ PATIENTS ══ */}
            {tab === 'patients' && (
              <>
                <div className="ad-page-header">
                  <h1>Patients</h1>
                  <p>All registered users in the system.</p>
                </div>
                <div className="ad-card">
                  <div className="ad-card-head">
                    <div className="ad-card-title">All Users</div>
                    <span className="ad-card-count">{filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Filters */}
                  <div className="ad-filters">
                    <input
                      className="ad-search"
                      placeholder="🔍  Search by name, email, or phone..."
                      value={searchUsers}
                      onChange={e => setSearchUsers(e.target.value)}
                    />
                    <select
                      className="ad-filter-select"
                      value={filterRole}
                      onChange={e => setFilterRole(e.target.value)}
                    >
                      <option value="All">All Roles</option>
                      <option value="USER">Patient</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {filteredUsers.length === 0 ? (
                    <div className="ad-empty">
                      <div className="ad-empty-icon">🔍</div>
                      <p>No users match your search.</p>
                    </div>
                  ) : (
                  <table className="ad-table">
                    <thead><tr>
                      <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th>
                    </tr></thead>
                    <tbody>
                      {filteredUsers.map(u => (
                          <tr key={u.id}>
                            <td><strong>{u.name}</strong></td>
                            <td style={{ color: '#78716c' }}>{u.email}</td>
                            <td style={{ color: '#78716c' }}>{u.phone}</td>
                            <td><span className={u.role === 'ADMIN' ? 'ad-role-admin' : 'ad-role-user'}>{u.role}</span></td>
                            <td style={{ color: '#78716c' }}>{u.joined}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  )}
                </div>
              </>
            )}

          </main>
      </div>
    </div>

      {/* ── MODAL: VIEW APPOINTMENT DETAILS ── */}
      {modalOpen && selectedAppt && !rescheduleMode && !showConfirmCancel && (
        <div className="ad-modal-overlay" onClick={closeModal}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <div className="ad-modal-header">
              <div className="ad-modal-title">Appointment Details</div>
              <button className="ad-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="ad-modal-body">
              {/* Patient Info */}
              <div className="ad-detail-row">
                <div className="ad-detail-label">Patient Name</div>
                <div className="ad-detail-value">{selectedAppt.patient}</div>
              </div>
              <div className="ad-detail-row">
                <div className="ad-detail-label">Email</div>
                <div className="ad-detail-value">{selectedAppt.userEmail}</div>
              </div>
              <div className="ad-detail-row">
                <div className="ad-detail-label">Phone</div>
                <div className="ad-detail-value">{selectedAppt.userPhone}</div>
              </div>

              <div className="ad-detail-divider"></div>

              {/* Appointment Info */}
              <div className="ad-detail-row">
                <div className="ad-detail-label">Service</div>
                <div className="ad-detail-value">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{serviceEmoji[selectedAppt.service] || '🤲'}</span>
                    <span>{selectedAppt.service}</span>
                  </div>
                </div>
              </div>
              <div className="ad-detail-row">
                <div className="ad-detail-label">Specialist</div>
                <div className="ad-detail-value">{selectedAppt.specialist}</div>
              </div>
              <div className="ad-detail-row">
                <div className="ad-detail-label">Date</div>
                <div className="ad-detail-value">{selectedAppt.date}</div>
              </div>
              <div className="ad-detail-row">
                <div className="ad-detail-label">Time</div>
                <div className="ad-detail-value">{selectedAppt.time}</div>
              </div>

              {/* Reason and Notes */}
              <div style={{ marginTop: '16px' }}>
                <div className="ad-detail-label" style={{ marginBottom: '8px' }}>Reason for Visit</div>
                <div style={{
                  background: '#fef3c7',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1c1408',
                  wordBreak: 'break-word'
                }}>
                  {selectedAppt.reason}
                </div>
              </div>

              {selectedAppt.notes && (
                <div style={{ marginTop: '16px' }}>
                  <div className="ad-detail-label" style={{ marginBottom: '8px' }}>Additional Notes</div>
                  <div style={{
                    background: '#f5f1e8',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#1c1408',
                    lineHeight: '1.5',
                    wordBreak: 'break-word'
                  }}>
                    {selectedAppt.notes}
                  </div>
                </div>
              )}

              {selectedAppt.status === 'Rescheduled by Patient' && (
                <div style={{ marginTop: '16px' }}>
                  <div className="ad-detail-label" style={{ marginBottom: '8px' }}>Reason For Rescheduling</div>
                  <div style={{
                    background: '#e0e7ff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#1c1408',
                    lineHeight: '1.5',
                    wordBreak: 'break-word'
                  }}>
                    {selectedAppt.rescheduleReason || 'No reason provided'}
                  </div>
                </div>
              )}

              {selectedAppt.cancellationReason && selectedAppt.status !== 'Rescheduled by Patient' && (
                <div style={{ marginTop: '16px' }}>
                  <div className="ad-detail-label" style={{ marginBottom: '8px' }}>Reason For Cancelling</div>
                  <div style={{
                    background: '#fee2e2',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#1c1408',
                    lineHeight: '1.5',
                    wordBreak: 'break-word'
                  }}>
                    {selectedAppt.cancellationReason}
                  </div>
                </div>
              )}

              <div className="ad-detail-divider"></div>

              {/* Status */}
              <div className="ad-detail-row">
                <div className="ad-detail-label">Current Status</div>
                <div className="ad-detail-value">
                  {(() => {
                    const st = statusStyle[selectedAppt.status];
                    return (
                      <span className="ad-badge" style={{ background: st.bg, color: st.color, width: 'fit-content' }}>
                        <span className="ad-dot" style={{ background: st.dot }} />{selectedAppt.status}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="ad-modal-actions">
              {(selectedAppt.status === 'Pending' || selectedAppt.status === 'Rescheduled by Patient') && (
                <>
                  <button className="ad-btn-secondary" onClick={closeModal}>Close</button>
                  <button className="ad-btn-danger" onClick={() => setShowConfirmCancel(true)}>Reject</button>
                  <button 
                    className="ad-btn-primary" 
                    onClick={() => {
                      handleStatus(selectedAppt.id, 'Approved');
                      closeModal();
                    }}
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                  >
                    ✓ Approve
                  </button>
                </>
              )}
              {(selectedAppt.status === 'Approved' || selectedAppt.status === 'Cancelled') && (
                <>
                  <button className="ad-btn-secondary" onClick={closeModal}>Close</button>
                  {selectedAppt.status === 'Approved' && (
                    <>
                      <button className="ad-btn-danger" onClick={() => setShowConfirmCancel(true)}>Call Off</button>
                      <button className="ad-btn-primary" onClick={() => setRescheduleMode(true)}>Reschedule</button>
                      <button 
                        className="ad-btn-primary" 
                        onClick={handleMarkAsDone}
                        style={{ background: 'linear-gradient(145deg, #819dcd, #0034a3)' }}
                      >
                        ✓ Mark as Done
                      </button>
                    </>
                  )}
                </>
              )}
              {selectedAppt.status === 'Done' && (
                <>
                  <button className="ad-btn-secondary" onClick={closeModal}>Close</button>
                  <button 
                    className="ad-btn-primary" 
                    onClick={() => setConfirmMarkAsApproved(true)}
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                  >
                    ↩ Return Status to Approved
                  </button>
                </>
              )}
              {selectedAppt.status === 'Canceled by Patient' && (
                <>
                  <button className="ad-btn-secondary" onClick={closeModal}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RESCHEDULE APPOINTMENT ── */}
      {modalOpen && selectedAppt && rescheduleMode && (
        <div className="ad-modal-overlay" onClick={closeModal}>
          <div className="ad-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="ad-modal-header">
              <div className="ad-modal-title">Select New Date & Time</div>
              <button className="ad-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="ad-modal-body" style={{ padding: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Calendar */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <button 
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#d97706' }}
                    >
                      ←
                    </button>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1c1408', minWidth: '140px', textAlign: 'center' }}>
                      {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button 
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#d97706' }}
                    >
                      →
                    </button>
                  </div>

                  {/* Weekday headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px' }}>
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                      <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                    {generateCalendarDays().map((day, idx) => {
                      const dateObj = day ? new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day) : null;
                      const dateStr = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}` : '';
                      const isSelected = reschedulingDate === dateStr;
                      const isSunday = dateObj && dateObj.getDay() === 0;
                      const isDisabled = !day || isSunday || dateObj < new Date(new Date().setHours(0, 0, 0, 0));
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => day && !isDisabled && setReschedulingDate(dateStr)}
                          style={{
                            padding: '10px',
                            border: isSelected ? '2px solid #d97706' : '1px solid #e8ddd0',
                            borderRadius: '8px',
                            background: isSelected ? '#fef3c7' : !day || isDisabled ? '#f5f1e8' : '#fff',
                            color: isDisabled ? '#c4a96b' : isSelected ? '#92400e' : '#1c1408',
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: !day || isDisabled ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s'
                          }}
                          disabled={!day || isDisabled}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#d97706', marginBottom: '18px' }}>
                    SELECT TIME
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Morning Section */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#a8956b', marginBottom: '10px' }}>
                        MORNING
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        {timeSlots.morning.map(time => {
                          const isNoon = time === '12:00';
                          return (
                            <button
                              key={time}
                              onClick={() => !isNoon && setReschedulingTime(time)}
                              disabled={isNoon}
                              style={{
                                padding: '12px',
                                border: reschedulingTime === time ? '2px solid #d97706' : '1.5px solid #e8ddd0',
                                borderRadius: '9px',
                                background: isNoon ? '#f5f1e8' : reschedulingTime === time ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : '#fff',
                                color: isNoon ? '#c4a96b' : reschedulingTime === time ? '#92400e' : '#6b5a4e',
                                fontSize: '14px',
                                fontWeight: reschedulingTime === time ? 700 : 500,
                                cursor: isNoon ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s',
                                opacity: isNoon ? 0.6 : 1
                              }}
                            >
                              {formatTimeSlot(time)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Afternoon Section */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#a8956b', marginBottom: '10px' }}>
                        AFTERNOON
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        {timeSlots.afternoon.map(time => (
                          <button
                            key={time}
                            onClick={() => setReschedulingTime(time)}
                            style={{
                              padding: '12px',
                              border: reschedulingTime === time ? '2px solid #d97706' : '1.5px solid #e8ddd0',
                              borderRadius: '9px',
                              background: reschedulingTime === time ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : '#fff',
                              color: reschedulingTime === time ? '#92400e' : '#6b5a4e',
                              fontSize: '14px',
                              fontWeight: reschedulingTime === time ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            {formatTimeSlot(time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ad-modal-actions">
              <button className="ad-btn-secondary" onClick={() => { setRescheduleMode(false); setReschedulingDate(''); setReschedulingTime(''); }}>Cancel</button>
              <button
                className="ad-btn-primary"
                onClick={handleRescheduleAppointment}
                disabled={!reschedulingDate || !reschedulingTime}
                style={{ opacity: (!reschedulingDate || !reschedulingTime) ? 0.6 : 1, cursor: (!reschedulingDate || !reschedulingTime) ? 'not-allowed' : 'pointer' }}
              >
                ✓ Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM CANCEL ── */}
      {modalOpen && selectedAppt && showConfirmCancel && (
        <div className="ad-modal-overlay" onClick={closeModal}>
          <div className="ad-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="ad-confirm-icon">⚠️</div>
            <div className="ad-confirm-title">Cancel Appointment?</div>
            <div className="ad-confirm-message">
              Are you sure you want to cancel this appointment for <strong>{selectedAppt.patient}</strong>? This action cannot be undone.
            </div>
            <div className="ad-confirm-actions">
              <button className="ad-btn-secondary" onClick={() => setShowConfirmCancel(false)}>Keep It</button>
              <button className="ad-btn-danger" onClick={handleCancelAppointment}>Yes, Cancel Appointment</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM MARK AS APPROVED ── */}
      {modalOpen && selectedAppt && confirmMarkAsApproved && (
        <div className="ad-modal-overlay" onClick={() => setConfirmMarkAsApproved(false)}>
          <div className="ad-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="ad-confirm-icon">📋</div>
            <div className="ad-confirm-title">Mark as Approved?</div>
            <div className="ad-confirm-message">
              Are you sure you want to mark this appointment for <strong>{selectedAppt.patient}</strong> as Approved? This action cannot be undone.
            </div>
            <div className="ad-confirm-actions">
              <button className="ad-btn-secondary" onClick={() => setConfirmMarkAsApproved(false)}>Cancel</button>
              <button 
                className="ad-btn-primary"
                onClick={() => {
                  handleStatus(selectedAppt.id, 'Approved');
                  setConfirmMarkAsApproved(false);
                  closeModal();
                }}
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                Yes, Mark as Approved
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}