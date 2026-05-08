import React, { useState, useEffect } from 'react'
import Logo from "../images/ZFBLU.webp"
import SignedImage from "../images/Voided.png"
import { useLocation } from 'react-router-dom'

function Blocked() {
    let location = useLocation()
    let [doctitle, setDocTitle] = useState('')
    let [docmsg, setDocMsg] = useState('')

    const logostyle = {
        width: "50px"
    }
    const logostyle1 = {
        width: "200px"
    }
    useEffect(() => {
        try {
            setDocTitle(location.state.doctitle)
            setDocMsg(location.state.msg)
        }
        catch (err) {
        }
    }, [])
    return (
        <>

            <div
                style={{
                    minHeight: '100vh',
                    background: '#1C4690',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 16px',
                }}
            >
                <div
                    style={{
                        maxWidth: 400,
                        width: '100%',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 20,
                        padding: '40px 32px 32px',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
                    }}
                >
                    {/* Logo */}
                    <img
                        src={Logo}
                        alt="logo"
                        style={{ width: 180, objectFit: 'contain', marginBottom: 36 }}
                    />

                    {/* Signed stamp */}
                    <img
                        src={SignedImage}
                        alt="Signed"
                        style={{ width: 80, marginBottom: 20, opacity: 0.95 }}
                    />

                    <h6 style={{ color: '#fff', fontWeight: 600, fontSize: '16px', marginBottom: 6 }}>
                        {docmsg}
                    </h6>

                    {doctitle && (
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: 20, fontStyle: 'italic' }}>
                            {doctitle}
                        </p>
                    )}



                </div>
            </div>





        </>

    )
}

export default Blocked