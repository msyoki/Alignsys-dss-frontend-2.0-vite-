import React, { useState, useEffect, useRef, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { FaAndroid, FaUser, FaEraser, FaFilePdf, FaPaperPlane } from 'react-icons/fa';
import { Modal, Box, IconButton, Button, Tooltip } from '@mui/material';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import '../styles/Chatbot.css';
import * as constants from './constants/constants';

// Lazy load heavy dependencies
const ReactMarkdown = lazy(() => import('react-markdown'));
const SyntaxHighlighter = lazy(() => import('react-syntax-highlighter').then(module => ({ 
    default: module.Prism 
})));
const vscDarkPlus = lazy(() => import('react-syntax-highlighter/dist/esm/styles/prism').then(module => ({
    default: module.vscDarkPlus
})));

const CodeBlock = memo(({ language, value }) => (
    <Suspense fallback={<pre>{value}</pre>}>
        <SyntaxHighlighter language={language} style={vscDarkPlus}>
            {value}
        </SyntaxHighlighter>
    </Suspense>
));

const Message = memo(({ message }) => (
    <div className={`message ${message.type}`}>
        {message.type !== 'user' && (
            <FaAndroid style={{ color: '#2757aa', fontSize: '20px' }} />
        )}
        <div className={`message-content ${message.type}-message`}>
            <Suspense fallback={<div>{message.content}</div>}>
                <ReactMarkdown components={{ code: CodeBlock }}>
                    {message.content}
                </ReactMarkdown>
            </Suspense>
        </div>
        {message.type === 'user' && (
            <FaUser style={{ color: '#555', fontSize: '20px' }} />
        )}
    </div>
));

const LoadingIndicator = memo(() => (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '15px' }}>
        <FaAndroid style={{
            fontSize: '18px',
            color: '#2757aa',
            marginRight: '10px',
            marginTop: '5px'
        }} />
        <div style={{
            backgroundColor: '#f4f4f4',
            padding: '12px 16px',
            borderRadius: '18px 18px 18px 4px',
            fontSize: '13px',
            color: '#666',
        }}>
            <span className="loading-dots">
                Analyzing<span>.</span><span>.</span><span>.</span>
            </span>
        </div>
    </div>
));

const SuggestedActions = memo(({ onSubmit, summarized }) => {
    const actions = useMemo(() => [
        "Summarize this document",
        "What are the main themes of this document?",
        "What conclusions does the author make?"
    ], []);

    return (
        <div className="d-flex flex-column align-items-center justify-content-center p-3">
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={(e) => onSubmit(e, action)}
                    disabled={summarized}
                    className="summarize-btn btn btn-sm rounded-pill m-2 text-dark d-flex align-items-center p-2"
                >
                    <span className="mx-auto">{action}</span>
                </button>
            ))}
        </div>
    );
});

const Chatbot = memo((props) => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [summarized, setSummarized] = useState(false);
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timeoutId);
    }, [messages.length, scrollToBottom]);

    const handleOpen = useCallback(() => {
        setOpen(prev => !prev);
    }, []);

    const handleClose = useCallback(() => {
        setOpen(false);
    }, []);

    const clearChat = useCallback(() => {
        setMessages([]);
        setSummarized(false);
    }, []);

    const makeAPICall = useCallback(async (topic) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
            let base64Data = props.base64;
            if (base64Data.startsWith('data:application/pdf;base64,')) {
                base64Data = base64Data.split(',')[1];
            }

            const formData = new URLSearchParams();
            formData.append('topic', topic);
            formData.append('base64_data', base64Data);

            const response = await axios.post(
                `${constants.boturl}/query-topic-base64`,
                formData,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    signal: abortControllerRef.current.signal,
                }
            );

            return response.data.response;
        } catch (error) {
            if (error.name === 'AbortError') return null;
            throw error;
        }
    }, [props.base64]);

    const handleSubmitWithTyping = useCallback(async (question) => {
        const userMessage = {
            type: 'user',
            content: question,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        try {
            const responseData = await makeAPICall(question);

            if (responseData) {
                const fullText = responseData.join('\n\n');
                let currentText = '';
                const timestamp = new Date();

                setMessages(prev => [...prev, {
                    type: 'copilot',
                    content: '',
                    timestamp
                }]);

                let index = 0;
                const typingSpeed = 20; // ms per character

                const interval = setInterval(() => {
                    currentText += fullText.charAt(index);
                    index++;

                    setMessages(prev => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;

                        if (updated[lastIndex]?.type === 'copilot') {
                            updated[lastIndex] = {
                                ...updated[lastIndex],
                                content: currentText,
                                timestamp
                            };
                        }

                        return updated;
                    });

                    if (index >= fullText.length) {
                        clearInterval(interval);
                    }
                }, typingSpeed);
            } else {
                setMessages(prev => [...prev, {
                    type: 'copilot',
                    content: "Sorry, I didn't get that. Could you please try again?",
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                type: 'copilot',
                content: "There was an error communicating with the server. Please try again later.",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    }, [makeAPICall]);

    const handleQuickAction = useCallback(async (e, question) => {
        e.preventDefault();
        setSummarized(true);
        await handleSubmitWithTyping(question);
    }, [handleSubmitWithTyping]);

    const handleChatSubmit = useCallback(async (e) => {
        e.preventDefault();
        const msg = inputValue.trim();
        if (!msg || loading) return;

        setInputValue('');
        await handleSubmitWithTyping(msg);
    }, [inputValue, loading, handleSubmitWithTyping]);

    const handleInputChange = useCallback((e) => {
        setInputValue(e.target.value);
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSubmit(e);
        }
    }, [handleChatSubmit]);

    const renderedMessages = useMemo(() => 
        messages.map((message, index) => (
            <Message key={`${message.timestamp.getTime()}-${index}`} message={message} />
        )), [messages]
    );

    const isSubmitDisabled = useMemo(() => 
        loading || !inputValue.trim(), [loading, inputValue]
    );

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return (
        <div>
            {props.base64 ? (
                <Tooltip placement="left-end" title="Ask AI Assistant">
                    <IconButton
                        sx={{
                            backgroundColor: '#2757aa',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            '&:hover': { backgroundColor: '#1C4690' }
                        }}
                        onClick={handleOpen}
                    >
                        <FaAndroid style={{ fontSize: '20px', color: '#fff' }} />
                    </IconButton>
                </Tooltip>
            ) : null}

            <Modal
                open={open}
                onClose={handleClose}
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                <Box className="chatbot-modal" sx={{
                    width: '500px',
                    height: '600px',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 24,
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {/* Header */}
                    <div className="chatbot-header" style={{
                        width: '100%',
                 
                        backgroundColor: '#2757aa',
                        color: 'white',
                        textAlign: 'center',
                        borderRadius: '8px 8px 0 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexGrow: 1,
                        }}>
                            <span className='mx-2' style={{ fontSize: '13px', fontWeight: 500 }}>
                                Ask AI Assistant
                            </span>
                        </div>

                        <IconButton onClick={handleClose} sx={{ color: 'white' }} aria-label="Close chatbot">
                            <FaTimes />
                        </IconButton>
                    </div>

                    {/* Document Info */}
                    {props.filename && (
                        <>
                            <div style={{
                    
                                backgroundColor: '#ecf4fc',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            className='p-2'
                            >
                                <span className='mx-2' style={{ fontSize: '13px', color: 'black' }}>
                                    Hello, how can I help with this document?
                                </span>
                                {messages.length > 0 && (
                                    <Tooltip title="Clear chat and start new">
                                        <IconButton onClick={clearChat} sx={{ color: '#2757aa', marginRight: '5px' }}>
                                            <FaEraser style={{ fontSize: '20px' }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </div>
                            <div style={{
                               
                                borderBottom: '1px solid #ecf4fc',
                                backgroundColor: '#ecf4fc',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            className='p-2'
                            >
                                <FaFilePdf className="text-danger mx-2" style={{ fontSize: '20px', marginRight: '8px' }} />
                                <span style={{ fontSize: '13px', color: 'black' }}>{props.filename}.pdf</span>
                            </div>
                        </>
                    )}

                    {/* Messages */}
                    <div className="chatbot-messages" style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '15px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {messages.length < 1 ? (
                            <SuggestedActions onSubmit={handleQuickAction} summarized={summarized} />
                        ) : (
                            renderedMessages
                        )}

                        {loading && <LoadingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Form */}
                    <form onSubmit={handleChatSubmit} className="input-container">
                        <div>
                            <textarea
                                className="chat-input"
                                placeholder="Ask your own question..."
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                type="submit"
                                className="send-button"
                                disabled={isSubmitDisabled}
                            >
                                <FaPaperPlane />
                            </button>
                        </div>
                    </form>
                </Box>
            </Modal>

            <style>{`
                .loading-dots span {
                    animation: loading 1.4s infinite ease-in-out both;
                }
                .loading-dots span:nth-child(1) {
                    animation-delay: -0.32s;
                }
                .loading-dots span:nth-child(2) {
                    animation-delay: -0.16s;
                }
                @keyframes loading {
                    0%,
                    80%,
                    100% {
                        opacity: 0;
                    }
                    40% {
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
});

Chatbot.displayName = 'Chatbot';

export default Chatbot;