import { supabase } from './supabaseClient.jsx';
import React, { useState, useEffect } from 'react';
import { MapContainer, ImageOverlay, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import mapImg from './assets/buengkan-map.jpg';
import car1 from './assets/car1.png';
import truckpng1 from './assets/truckpng1.png';
import truckpng2 from './assets/truckpng2.png';
import truckpng3 from './assets/truckpng3.png';
import truckpng4 from './assets/truckpng4.png';
import flagIcon from './assets/flag-icon.png';
import logo from './assets/logo.png';

const carIcons = [car1, truckpng1, truckpng2, truckpng3, truckpng4].map((img) =>
  L.icon({ iconUrl: img, iconSize: [50, 50], iconAnchor: [25, 25] })
);

const flagLeafletIcon = L.icon({
  iconUrl: flagIcon,
  iconSize: [25, 25],
  iconAnchor: [12, 25],
});

const bounds = [
  [0, 0],
  [1000, 1000],
];

const districts = [
  { id: 'd1', name: 'เมืองบึงกาฬ', x: 720, y: 420 },
  { id: 'd2', name: 'ศรีวิไล', x: 555, y: 575 },
  { id: 'd3', name: 'เซกา', x: 350, y: 630 },
  { id: 'd4', name: 'พรเจริญ', x: 450, y: 480 },
  { id: 'd5', name: 'ปากคาด', x: 650, y: 260 },
  { id: 'd6', name: 'บึงโขงหลง', x: 480, y: 780 },
  { id: 'd7', name: 'บุ่งคล้า', x: 720, y: 680 },
  { id: 'd8', name: 'โซ่พิสัย', x: 480, y: 290 },
  { id: 'd0', name: 'ต่างจังหวัด', x: 300, y: 80 },
];

const placedColors = [
  '#007bff',
  '#28a745',
  '#dc3545',
  '#6f42c1',
  '#17a2b8',
  '#fd7e14',
];

export default function VehicleDashboardMap() {
  const [assignedCars, setAssignedCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [reserveCar, setReserveCar] = useState(null);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [currentDistrict, setCurrentDistrict] = useState(null);
  const [driverSelect, setDriverSelect] = useState("");
  const [driverInput, setDriverInput] = useState('');
  const [driverDate, setDriverDate] = useState('');
  const [showAllStatus, setShowAllStatus] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [replaceModal, setReplaceModal] = useState(null);
  const [removeModal, setRemoveModal] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [sidebarLocked, setSidebarLocked] = useState(true);



  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const vehicles = [
    { id: 'v1', plate: 'นก 723 บึงกาฬ', icon: carIcons[0] },
    { id: 'v2', plate: 'กข 3279 บึงกาฬ', icon: carIcons[1] },
    { id: 'v3', plate: 'กข 3363 บึงกาฬ', icon: carIcons[2] },
    { id: 'v4', plate: '6กฮ 3078 กทม', icon: carIcons[3] },
    { id: 'v5', plate: '2ขฆ 6814 กทม', icon: carIcons[4] },
    { id: 'v6', plate: '5ขฬ 1041 กทม', icon: carIcons[4] },
  ];

  const sidebarWidth = sidebarOpen
    ? windowWidth < 768
      ? '100px'
      : '300px'
    : '0px';

  const getActiveCars = () => {
    const today = new Date();
    return assignedCars.filter((c) => {
      const carDate = new Date(c.date);
      const diff = (today - carDate) / (1000 * 60 * 60 * 24);
      return diff <= 1;
    });
  };

  const getCarsInDistrict = (districtId) =>
    getActiveCars().filter((c) => c.district_id === districtId);

  const isCarPlaced = (plate) =>
    getActiveCars().some((c) => c.plate === plate && !c.reserved);

  const buttonStyle = (key, baseColor) => ({
    padding: '10px',
    borderRadius: '6px',
    border: 'none',
    background: baseColor,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    transform: hoveredButton === key ? 'scale(1.05)' : 'scale(1)',
    boxShadow:
      hoveredButton === key ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.15)',
  });

  useEffect(() => {
    const deleteOldCarsAndFetch = async () => {
      try {
        const today = new Date();
        const yesterdayISO = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString();

        const { error: deleteError } = await supabase
          .from('assigned_cars')
          .delete()
          .lt('date', yesterdayISO);

        if (deleteError) console.error('ลบรถเก่าไม่สำเร็จ:', deleteError);

        const { data, error: fetchError } = await supabase.from('assigned_cars').select('*');

        if (fetchError) console.error('ดึงข้อมูลรถไม่สำเร็จ:', fetchError);
        else setAssignedCars(data);
      } catch (err) {
        console.error('เกิดข้อผิดพลาด:', err);
      }
    };

    deleteOldCarsAndFetch();
  }, []);

  const handleDistrictClick = (district) => {
    if (!accessGranted || accessGranted === 'statusOnly') {
      setPopupMessage(!accessGranted ? 'กรุณากรอกคีย์เวิร์ดก่อนใช้งาน' : 'คีย์เวิร์ดไม่ถูกต้อง');
      setShowPopup(true);
      return;
    }
    
    const carsHere = getCarsInDistrict(district.id);

    if (selectedCar || reserveCar) {
      if (carsHere.length === 0) {
        setCurrentDistrict(district);
        setDriverInput('');
        setDriverDate('');
        setShowDriverForm(true);
        return;
      }
      setActionMenu({ district });
      return;
    }

    if (carsHere.length > 0) {
      setActionMenu({ district });
    }
  };

  const submitDriverForm = async () => {
    if (!driverInput || !driverDate) return;

    const carObj = vehicles.find((v) => v.plate === selectedCar);
    const newCar = {
      driver: driverInput,
      plate: carObj.plate,
      date: driverDate,
      district_name: currentDistrict.name,
    };

    try {
      const { data, error } = await supabase
        .from('assigned_cars')
        .insert([
          {
            ...newCar,
            x: currentDistrict.x,
            y: currentDistrict.y,
            district_id: currentDistrict.id,
            reserved: reserveCar === selectedCar,
          },
        ])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      setAssignedCars((prev) => [...prev, ...data]);
      setSelectedCar(null);
      setReserveCar(null);
      setCurrentDistrict(null);
      setShowDriverForm(false);
    } catch (err) {
      console.error('Supabase error:', err);
      return;
    }

    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbyeUA_a5wk4SBjD2_fcQUBsq86t68Whyubi2_OTzW-pmMNJ4rkxc7mLpBVpE7yGlXFo/exec',
        {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(newCar),
        }
      );
      const text = await response.text();
      const result = JSON.parse(text);
      console.log('Google Sheet result:', result);
    } catch (err) {
      console.error('Google Sheet error:', err);
    }
  };

  const removeCar = async (car) => {
    const { error } = await supabase.from('assigned_cars').delete().eq('id', car.id);
    if (!error) {
      setAssignedCars((prev) => prev.filter((c) => c.id !== car.id));
      setRemoveModal(null);
      setActionMenu(null);
    } else {
      console.error(error);
    }
  };

  const replaceCar = async (oldCar, newCarPlate) => {
    await supabase.from('assigned_cars').delete().eq('id', oldCar.id);
    setSelectedCar(newCarPlate);
    setReplaceModal(null);
    setCurrentDistrict(districts.find((d) => d.id === oldCar.district_id) || null);
    setShowDriverForm(true);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial,sans-serif', background: '#fdf6e3' }}>
      {/* Sidebar */}
      <div
  style={{
    width: sidebarWidth,
    transition: 'width 0.3s',
    overflowY: 'auto', // ให้ scroll แนวตั้ง
    maxHeight: '100vh', // ไม่ให้เกินหน้าจอ
    borderRight: sidebarOpen ? '1px solid #ccc' : 'none',
    background: '#fff8e1',
    padding: sidebarOpen ? '10px' : '0px',
  }}
>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            top: 10,
            left: sidebarOpen ? 310 : 10,
            zIndex: 2000,
            padding: '6px 10px',
            borderRadius: '4px',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {sidebarOpen && (
          <div>
            <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>🚗 รายการรถ</h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '10px', gap: '6px' }}>
  {/* ปุ่มดูสถานะทั้งหมด */}
  <button
    style={buttonStyle('showStatus', '#17a2b8')}
    onMouseEnter={() => setHoveredButton('showStatus')}
    onMouseLeave={() => setHoveredButton(null)}
    onClick={() => setShowAllStatus(!showAllStatus)}
  >
    {showAllStatus ? 'ซ่อนสถานะทั้งหมด' : 'ดูสถานะทั้งหมด'}
  </button>

  {/* ปุ่มดูสถานะผ่านแดชบอร์ด พร้อมไอคอน */}
  <a
    href="https://bgvehicledb.my.canva.site/" // <-- เปลี่ยนเป็นลิงก์จริงของคุณ
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 14px',
      borderRadius: '6px',
      background: '#28a745',
      color: '#fff',
      textDecoration: 'none',
      cursor: 'pointer',
      textAlign: 'center',
      flex: '1 1 auto',
      minWidth: windowWidth < 768 ? '100%' : 'auto'
    }}
    onMouseEnter={() => setHoveredButton('dashboardLink')}
    onMouseLeave={() => setHoveredButton(null)}
  >
    <span style={{ marginRight: '6px' }}>📊</span> ดูสถานะและสถิติผ่านแดชบอร์ด
  </a>
</div>


{vehicles.map((v) => {
  const placed = isCarPlaced(v.plate);
  const selected = selectedCar === v.plate;
  const reserving = reserveCar === v.plate;

  return (
    <div
      key={v.id}
      style={{
        display: 'flex',
        flexDirection: windowWidth < 768 ? 'column' : 'row',
        alignItems: 'center',
        gap: '6px',
        padding: '8px',
        marginBottom: '6px',
        borderRadius: '6px',
        background: selected ? (reserving ? '#ffc107' : '#007bff') : '#fff',
        color: selected ? '#fff' : '#000',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      <img src={v.icon.options.iconUrl} alt="car" style={{ width: '35px' }} />

      {/* ปุ่มทะเบียนรถ */}
      <span
        style={{
          cursor: (!accessGranted || accessGranted === 'statusOnly' || placed) ? 'not-allowed' : 'pointer',
          opacity: (!accessGranted || placed) ? 0.5 : 1,
          borderRadius: '4px',
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap'
        }}
        onClick={() => {
          if (!accessGranted || accessGranted === 'statusOnly') {
            setPopupMessage(!accessGranted ? 'กรุณากรอกคีย์เวิร์ดก่อนใช้งาน' : 'คีย์เวิร์ดไม่ถูกต้อง');
            setShowPopup(true);
            return;
          }
          if (!placed) {
            setSelectedCar(v.plate);
            setReserveCar(null);
          }
        }}
      >
        {v.plate}
        {sidebarLocked && <span style={{ fontSize: '12px', color: '#888' }}>🔒</span>}
      </span>

      {/* ปุ่มจอง */}
      <button
        style={{
          ...buttonStyle('reserve-' + v.id, '#ffc107'),
          marginTop: windowWidth < 768 ? '4px' : '0px',
          alignSelf: windowWidth < 768 ? 'flex-start' : 'auto',
          opacity: (!accessGranted || placed) ? 0.5 : 1,
          cursor: (!accessGranted || accessGranted === 'statusOnly') ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap'
        }}
        onMouseEnter={() => setHoveredButton('reserve-' + v.id)}
        onMouseLeave={() => setHoveredButton(null)}
        onClick={() => {
          if (!accessGranted || accessGranted === 'statusOnly') {
            setPopupMessage(!accessGranted ? 'กรุณากรอกคีย์เวิร์ดก่อนใช้งาน' : 'คีย์เวิร์ดไม่ถูกต้อง');
            setShowPopup(true);
            return;
          }
          setSelectedCar(v.plate);
          setReserveCar(v.plate);
        }}
      >
        จอง
        {sidebarLocked && <span style={{ fontSize: '12px', color: '#888' }}>🔒</span>}
      </button>
    </div>
  );
})}

          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
      {showPopup && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000,
    }}
  >
    <div
      style={{
        background: '#fff',
        padding: '20px 30px',
        borderRadius: '8px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        textAlign: 'center',
        minWidth: '250px',
      }}
    >
      <p style={{ marginBottom: '15px', fontSize: '16px' }}>{popupMessage}</p>
      <button
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: 'none',
          background: '#007bff',
          color: '#fff',
          cursor: 'pointer',
        }}
        onClick={() => setShowPopup(false)}
      >
        ปิด
      </button>
    </div>
  </div>
)}

      {!accessGranted && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
  }}>
    <div style={{
      background: '#fff',
      padding: '20px',
      borderRadius: '8px',
      width: '300px',
      textAlign: 'center'
    }}>
      <h3>กรุณากรอกคีย์เวิร์ด</h3>
      <input
        type="password"
        value={passwordInput}
        onChange={(e) => setPasswordInput(e.target.value)}
        placeholder="คีย์เวิร์ด"
        style={{ width: '100%', padding: '6px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
        <button
          onClick={() => {
            if (passwordInput === '0015') { // คีย์เวิร์ดสำหรับวางรถ/จอง
              setAccessGranted(true);
            } else {
              alert('คีย์เวิร์ดไม่ถูกต้อง');
              setPasswordInput('');
            }
          }}
          style={{ flex: 1, padding: '6px', borderRadius: '4px', border: 'none', background: '#007bff', color: '#fff' }}
        >
          ยืนยัน
        </button>
        <button
  onClick={() => {
    setAccessGranted('statusOnly');
    setSidebarLocked(true); // ล็อค sidebar คงอยู่
  }}
          style={{ flex: 1, padding: '6px', borderRadius: '4px', border: 'none', background: '#17a2b8', color: '#fff' }}
        >
          ดูสถานะรถ
        </button>
      </div>
    </div>
  </div>
)}

        <img
          src={logo}
          alt="โลโก้"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: '100px',
            zIndex: 1500,
          }}
        />
        <MapContainer center={[500, 500]} zoom={0} crs={L.CRS.Simple} style={{ height: '100%', width: '100%' }}>
          <ImageOverlay url={mapImg} bounds={bounds} />
          {districts.map((d) => {
            const carsHere = getCarsInDistrict(d.id);
            const position = carsHere.length > 0 ? [carsHere[0].x, carsHere[0].y] : [d.x, d.y];
            const icon =
              carsHere.length > 0 ? vehicles.find((v) => v.plate === carsHere[0].plate)?.icon || flagLeafletIcon : flagLeafletIcon;

            return (
              <Marker key={d.id + (showAllStatus ? '-show' : '')} position={position} icon={icon} eventHandlers={{
                click: () => {
                  if (!accessGranted || accessGranted === 'statusOnly') {
                    setPopupMessage(!accessGranted ? 'กรุณากรอกคีย์เวิร์ดก่อนใช้งาน' : 'คีย์เวิร์ดไม่ถูกต้อง');
                    setShowPopup(true);
                    return;
                  }
                  
                  handleDistrictClick(d);
                }
              }}
              >
                <Tooltip direction="top" offset={[0, -10]} permanent={showAllStatus} opacity={1}>
                  <div style={{ minWidth: '120px', background: '#fff', padding: '2px 4px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                    <strong>{d.name}</strong>
                    {carsHere.length === 0 ? (
                      <div style={{ marginTop: '4px', color: '#555' }}>ไม่มีรถในขณะนี้</div>
                    ) : (
                      carsHere.map((c, i) => {
                        const color = c.reserved ? '#ffc107' : placedColors[i % placedColors.length];
                        return (
                          <div key={i} style={{ marginTop: '3px', color, fontWeight: c.reserved ? 'normal' : 'bold' }}>
                            {c.plate} ({c.driver})<br />
                            <span style={{ fontSize: '10px', color: '#333' }}>วันที่: {c.date}</span>
                            {c.reserved && <span style={{ fontSize: '10px', color: '#555' }}> (จอง)</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Modals */}
      {showDriverForm && currentDistrict && selectedCar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '6px', width: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <h4>{reserveCar === selectedCar ? 'จองล่วงหน้า' : 'วางรถ'}</h4>
            <p>{selectedCar} → {currentDistrict.name}</p>

           {/* Dropdown เลือกชื่อ driver */}
           <label>ชื่อผู้ยืม:</label>
<select
  value={driverSelect}
  onChange={(e) => {
    const val = e.target.value;
    setDriverSelect(val);
    if (val !== "custom") {
      setDriverInput(val); // กรณีเลือกชื่อจากลิสต์ → ใช้เลย
    } else {
      setDriverInput("");  // ถ้าเลือก custom → เคลียร์ไว้ให้พิมพ์เอง
    }
  }}
  style={{
    width: "100%",
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginBottom: "10px",
  }}
>
  <option value="">-- เลือกผู้ยืม --</option>
  <option value="นายเฉลิมเกียรติ แผนกิจเจริญ" style={{ color: "orange" }}>นายเฉลิมเกียรติ แผนกิจเจริญ</option>
  <option value="นางสาววิมล มุ่งกลาง" style={{ color: "dodgerblue" }}>นางสาววิมล มุ่งกลาง</option>
  <option value="นางกานดา เกตุพันธ์" style={{ color: "dodgerblue" }}>นางกานดา เกตุพันธ์</option>
  <option value="นางสาวสุจิตตรา ประยงค์" style={{ color: "dodgerblue" }}>นางสาวสุจิตตรา ประยงค์</option>
  <option value="นางสาวชุติมา โฮมวงศ์" style={{ color: "dodgerblue" }}>นางสาวชุติมา โฮมวงศ์</option>
  <option value="นางสาวรัชดา โสระธิวา" style={{ color: "dodgerblue" }}>นางสาวรัชดา โสระธิวา</option>
  <option value="นายณัชพล ต่างสากล" style={{ color: "dodgerblue" }}>นายณัชพล ต่างสากล</option>
  <option value="นายเอกชัย ปาสาจะ" style={{ color: "dodgerblue" }}>นายเอกชัย ปาสาจะ</option>
  <option value="นายสยัมภู แพงจันทร์" style={{ color: "green" }}>นายสยัมภู แพงจันทร์</option>
  <option value="นายเชษฐา โคตรวันดี" style={{ color: "green" }}>นายเชษฐา โคตรวันดี</option>
  <option value="นายธมกร มหธนคม" style={{ color: "green" }}>นายธมกร มหธนคม</option>
  <option value="นางสาวจุฑารัตน์ คงมา" style={{ color: "green" }}>นางสาวจุฑารัตน์ คงมา</option>
  <option value="นางสาวพชรพร บุญปก" style={{ color: "green" }}>นางสาวพชรพร บุญปก</option>
  <option value="นางสาวชุติมา คลังชำนาญ" style={{ color: "gold" }}>นางสาวชุติมา คลังชำนาญ</option>
  <option value="นายวิรุธ สมทอง" style={{ color: "gold" }}>นายวิรุธ สมทอง</option>
  <option value="นางสาวปัญชุกา จันทรา" style={{ color: "gold" }}>นางสาวปัญชุกา จันทรา</option>
  <option value="นางพัชรินทร์ ธรรมสาร" style={{ color: "navy" }}>นางพัชรินทร์ ธรรมสาร</option>
  <option value="นางสาวธัญวรรณ จันปุ่ม" style={{ color: "navy" }}>นางสาวธัญวรรณ จันปุ่ม</option>
  <option value="นางสาวพิชชาภา คำมุงคุณ" style={{ color: "navy" }}>นางสาวพิชชาภา คำมุงคุณ</option>
  <option value="นายปิยพงษ์ โสภา" style={{ color: "navy" }}>นายปิยพงษ์ โสภา</option>
  <option value="custom">กรอกเอง...</option>
</select>

{/* input ถ้าเลือก custom */}
{driverSelect === "custom" && (
  <input
    type="text"
    value={driverInput}
    onChange={(e) => setDriverInput(e.target.value)}
    placeholder="กรอกชื่อผู้ยืม"
    style={{
      width: "100%",
      padding: "6px",
      marginBottom: "10px",
      borderRadius: "4px",
      border: "1px solid #ccc",
    }}
  />
)}

            <div style={{ marginBottom: '10px' }}>
              <label>วันที่: </label>
              <input
                type="date"
                value={driverDate || (reserveCar === selectedCar ? '' : new Date().toISOString().split('T')[0])}
                onChange={(e) => setDriverDate(e.target.value)}
                disabled={reserveCar !== selectedCar}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => { setShowDriverForm(false); setReserveCar(null); setSelectedCar(null); }}>ยกเลิก</button>
              <button
                onClick={() => {
                  if (!driverDate && reserveCar !== selectedCar) {
                    setDriverDate(new Date().toISOString().split('T')[0]);
                  } else {
                    submitDriverForm();
                  }
                }}
                style={{ background: '#007bff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px' }}
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {actionMenu && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '300px', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3>มีรถอยู่แล้วที่ {actionMenu.district.name}</h3>
            <button
              style={buttonStyle('add-' + actionMenu.district.id, '#007bff')}
              onMouseEnter={() => setHoveredButton('add-' + actionMenu.district.id)}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => { setCurrentDistrict(actionMenu.district); setShowDriverForm(true); setActionMenu(null); }}
            >
              เพิ่มรถ
            </button>
            <button
              style={buttonStyle('replace-' + actionMenu.district.id, '#28a745')}
              onMouseEnter={() => setHoveredButton('replace-' + actionMenu.district.id)}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => { setReplaceModal(actionMenu.district); setActionMenu(null); }}
            >
              แทนที่รถ
            </button>
            <button
              style={buttonStyle('remove-' + actionMenu.district.id, '#dc3545')}
              onMouseEnter={() => setHoveredButton('remove-' + actionMenu.district.id)}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => { setRemoveModal(actionMenu.district); setActionMenu(null); }}
            >
              ถอดรถ
            </button>
            <button
              style={buttonStyle('cancel-' + actionMenu.district.id, '#6c757d')}
              onMouseEnter={() => setHoveredButton('cancel-' + actionMenu.district.id)}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setActionMenu(null)}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {replaceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2100 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '300px', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3>แทนที่รถใน {replaceModal.name}</h3>
            {getCarsInDistrict(replaceModal.id).map((c, i) => (
              <button
                key={i}
                style={buttonStyle('replaceCar-' + i, '#dc3545')}
                onMouseEnter={() => setHoveredButton('replaceCar-' + i)}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={() => replaceCar(c, selectedCar)}
              >
                {c.plate} ({c.driver})
              </button>
            ))}
            <button
              style={buttonStyle('replaceCancel', 'gray')}
              onMouseEnter={() => setHoveredButton('replaceCancel')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setReplaceModal(null)}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {removeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2100 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '300px', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3>ถอดรถจาก {removeModal.name}</h3>
            {getCarsInDistrict(removeModal.id).map((c, i) => (
              <button
                key={i}
                style={buttonStyle('removeCar-' + i, '#dc3545')}
                onMouseEnter={() => setHoveredButton('removeCar-' + i)}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={() => removeCar(c)}
              >
                {c.plate} ({c.driver})
              </button>
            ))}
            <button
              style={buttonStyle('removeCancel', 'gray')}
              onMouseEnter={() => setHoveredButton('removeCancel')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setRemoveModal(null)}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
