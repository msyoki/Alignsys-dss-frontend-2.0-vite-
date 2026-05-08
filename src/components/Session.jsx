import React, { useEffect, useState } from 'react';

function Session() {
  const [isIdle, setIsIdle] = useState(false);
  let timeoutId;

  const handleUserActivity = () => {
    clearTimeout(timeoutId);

    if (isIdle) {
      setIsIdle(false);
    }

    timeoutId = setTimeout(() => {
      setIsIdle(true);
    }, 30000); // 30 seconds of inactivity to consider as idle
  };

  useEffect(() => {
    // Add event listeners for user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Start the idle timeout initially
    timeoutId = setTimeout(() => {
      setIsIdle(true);
    }, 30000); // 30 seconds of inactivity to consider as idle

    // Clean up the event listeners and timeout on component unmount
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, []);

  return (
    <div>
      {isIdle ? (
        <div>You have been idle.</div>
      ) : (
        <div>Active</div>
      )}
    </div>
  );
}
export default Session;