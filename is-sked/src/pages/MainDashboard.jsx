import { useState, useEffect } from "react";
import NavBar from "../components/NavigationBar"
import styles from "../css/MainDashboard.module.css"

export default function MainDashboard() {
  useEffect(() => {
    document.title = "Main Dashboard | IsSked";
    document.body.classList.add(styles.mainBody);
    return () => {
      document.body.classList.remove(styles.mainBody);
    };
  }, []);

  return (
    <>
      <NavBar />
      <div className={styles.wholeContent}>
        <div className={styles.elements}>
          <div className={styles.parent}>
            <div className={`${styles.child} ${styles.left}`}>
              <h1>
                <span style={{ fontSize: '40px' }}>Schedules</span>
                <span className={styles.block}>Active Schedule</span>
              </h1>
            </div>
            <div className={`${styles.child} ${styles.center}`}></div>
            <div className={`${styles.child} ${styles.right}`}>
              <button className={styles.addButton}>
                Create New Schedule
              </button>
            </div>
          </div>
        </div>
        <div className={`${styles.elements} ${styles.box}`}>
          <span style={{ fontSize: '30px', fontWeight: 'bold' }}>Active Sched</span>
          <span style={{ fontSize: '15px' }}>Last Modified: 11/08/2025</span>
        </div>
        <div className={`${styles.elements} ${styles.schedList}`}>
          <div className={`${styles.elements} ${styles.box}`}>
            <span style={{ fontSize: '30px', fontWeight: 'bold' }}>Sched 1</span>
            <span style={{ fontSize: '15px' }}>Last Modified: 11/08/2025</span>
          </div>
          <div className={`${styles.elements} ${styles.box}`}>
            <span style={{ fontSize: '30px', fontWeight: 'bold' }}>Sched 2</span>
            <span style={{ fontSize: '15px' }}>Last Modified: 11/08/2025</span>
          </div>
          <div className={`${styles.elements} ${styles.box}`}>
            <span style={{ fontSize: '30px', fontWeight: 'bold' }}>Sched 3</span>
            <span style={{ fontSize: '15px' }}>Last Modified: 11/08/2025</span>
          </div>
          <div className={`${styles.elements} ${styles.box}`}>
            <span style={{ fontSize: '30px', fontWeight: 'bold' }}>Sched 4</span>
            <span style={{ fontSize: '15px' }}>Last Modified: 11/08/2025</span>
          </div>
          <div className={`${styles.elements} ${styles.box}`}>
            <span style={{ fontSize: '30px', fontWeight: 'bold' }}>Sched 5</span>
            <span style={{ fontSize: '15px' }}>Last Modified: 11/08/2025</span>
          </div>
        </div>
      </div>
    </>
  );
}