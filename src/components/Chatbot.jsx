import React, { useState, useEffect, useRef, useCallback, memo, lazy, Suspense, useId } from 'react';
import { IconButton, Tooltip, Slide } from '@mui/material';
import { HiSparkles } from 'react-icons/hi';
import {
    FaTimes, FaPaperPlane, FaListUl, FaFileAlt, FaLightbulb, FaChevronRight, FaExclamationTriangle,
} from 'react-icons/fa';
import { FaPenToSquare, FaRegCopy, FaCheck, FaRotateRight } from 'react-icons/fa6';
import axios from 'axios';
import '../styles/Chatbot.css';
import * as constants from './constants/constants';

// Lazy load heavy dependencies
const ReactMarkdown = lazy(() => import('react-markdown'));
const SyntaxHighlighter = lazy(() => import('react-syntax-highlighter').then(module => ({
    default: module.Prism
})));

const CodeBlock = memo(({ language, value }) => (
    <Suspense fallback={<pre>{value}</pre>}>
        <SyntaxHighlighter language={language}>
            {value}
        </SyntaxHighlighter>
    </Suspense>
));

const SUGGESTIONS = [
    { text: 'Summarize this document', short: 'Summarize', icon: FaListUl },
    { text: 'What are the main themes of this document?', short: 'Main themes?', icon: FaFileAlt },
    { text: 'What conclusions does the author make?', short: "Author's conclusions?", icon: FaLightbulb },
];

const TYPING_SPEED = 20; // ms per character

const Spark = ({ size = 'sm' }) => (
    <span className={`aia-spark aia-spark-${size}`} aria-hidden>
        <HiSparkles />
    </span>
);

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for browsers that refuse clipboard access.
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        document.body.removeChild(ta);
        return ok;
    }
}

const AssistantMessage = memo(({ message, typing, onRetry }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return undefined;
        const t = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(t);
    }, [copied]);

    if (message.type === 'error') {
        return (
            <div className="aia-error" role="alert">
                <FaExclamationTriangle className="aia-error-icon" aria-hidden />
                <span>{message.content}</span>
                <button type="button" className="aia-retry" onClick={() => onRetry(message)}>
                    <FaRotateRight size={11} aria-hidden /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="aia-msg-a">
            <Spark />
            <div className="aia-msg-a-text">
                <Suspense fallback={<div>{message.content}</div>}>
                    <ReactMarkdown components={{ code: CodeBlock }}>
                        {message.content}
                    </ReactMarkdown>
                </Suspense>
                {!typing && message.content && (
                    <div className="aia-acts">
                        <button
                            type="button"
                            className={`aia-act${copied ? ' done' : ''}`}
                            onClick={async () => setCopied(await copyText(message.content))}
                        >
                            {copied ? <FaCheck size={11} aria-hidden /> : <FaRegCopy size={11} aria-hidden />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

const Chatbot = memo((props) => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [typing, setTyping] = useState(false);
    const [used, setUsed] = useState([]); // suggestions already asked in this chat
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const typingRef = useRef(null);
    const inputRef = useRef(null);
    const buttonRef = useRef(null);
    const titleId = useId();

    const busy = loading || typing;
    const fileLabel = props.filename
        ? (/\.pdf$/i.test(props.filename) ? props.filename : `${props.filename}.pdf`)
        : 'This document';

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timeoutId);
    }, [messages, loading, scrollToBottom]);

    const stopTyping = useCallback(() => {
        if (typingRef.current) {
            clearInterval(typingRef.current);
            typingRef.current = null;
        }
        setTyping(false);
    }, []);

    const stopAll = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        stopTyping();
        setLoading(false);
    }, [stopTyping]);

    const clearChat = useCallback(() => {
        stopAll();
        setMessages([]);
        setUsed([]);
        setInputValue('');
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [stopAll]);

    // A different document starts a fresh chat.
    useEffect(() => {
        stopAll();
        setMessages([]);
        setUsed([]);
    }, [props.base64, stopAll]);

    // Stop everything when the component goes away.
    useEffect(() => () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        if (typingRef.current) clearInterval(typingRef.current);
    }, []);

    const handleOpen = useCallback(() => setOpen(prev => !prev), []);

    const handleClose = useCallback(() => {
        setOpen(false);
        setTimeout(() => buttonRef.current?.focus(), 0);
    }, []);

    // On wide screens, sit exactly over the Document Details column when the page has one,
    // so the panel lines up with the layout instead of covering part of it.
    const [dock, setDock] = useState(null);
    useEffect(() => {
        if (!open) return undefined;
        const target = document.querySelector('.signing-details');
        const update = () => {
            const r = target?.getBoundingClientRect();
            if (!r || window.innerWidth < 992 || r.width < 280) { setDock(null); return; }
            setDock((prev) => {
                const next = { left: Math.round(r.left), width: Math.round(r.width) };
                return prev && prev.left === next.left && prev.width === next.width ? prev : next;
            });
        };
        update();
        window.addEventListener('resize', update);
        let ro;
        if (target && typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(update);
            ro.observe(target);
        }
        return () => { window.removeEventListener('resize', update); if (ro) ro.disconnect(); };
    }, [open]);

    // Focus the input when the panel opens; Esc closes it.
    useEffect(() => {
        if (!open) return undefined;
        const t = setTimeout(() => inputRef.current?.focus(), 250);
        const onKey = (e) => {
            if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('.MuiDialog-root')) {
                handleClose();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
    }, [open, handleClose]);

    // Grow the input with its text, up to a limit.
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }, [inputValue, open]);

    const makeAPICall = useCallback(async (topic) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        let base64Data = props.base64;
        if (base64Data.startsWith('data:application/pdf;base64,')) {
            base64Data = base64Data.split(',')[1];
        }

        const formData = new URLSearchParams();
        formData.append('topic', topic);
        formData.append('base64_data', base64Data);

        try {
            const response = await axios.post(
                `${constants.boturl}/query-topic-base64`,
                formData,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    signal: controller.signal,
                }
            );
            return { data: response.data.response };
        } finally {
            if (abortControllerRef.current === controller) abortControllerRef.current = null;
        }
    }, [props.base64]);

    const typeOut = useCallback((fullText) => {
        const timestamp = new Date();
        setMessages(prev => [...prev, { type: 'copilot', content: '', timestamp }]);
        setTyping(true);

        let index = 0;
        typingRef.current = setInterval(() => {
            index++;
            const currentText = fullText.slice(0, index);
            setMessages(prev => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (updated[lastIndex]?.type === 'copilot') {
                    updated[lastIndex] = { ...updated[lastIndex], content: currentText };
                }
                return updated;
            });
            if (index >= fullText.length) {
                clearInterval(typingRef.current);
                typingRef.current = null;
                setTyping(false);
            }
        }, TYPING_SPEED);
    }, []);

    const ask = useCallback(async (question) => {
        if (!question || !props.base64) return;
        stopTyping();
        setMessages(prev => [...prev, { type: 'user', content: question, timestamp: new Date() }]);
        setLoading(true);

        try {
            const { data } = await makeAPICall(question);
            const fullText = Array.isArray(data) ? data.join('\n\n') : (data || '');
            setLoading(false);
            if (fullText.trim()) {
                typeOut(fullText);
            } else {
                setMessages(prev => [...prev, {
                    type: 'copilot',
                    content: "I couldn't find an answer to that in this document. Try asking it another way.",
                    timestamp: new Date(),
                }]);
            }
        } catch (error) {
            if (axios.isCancel(error) || error?.name === 'AbortError' || error?.name === 'CanceledError') {
                return; // stopped by the user, a new chat, or a new document
            }
            console.error('AI assistant error:', error);
            setLoading(false);
            setMessages(prev => [...prev, {
                type: 'error',
                question,
                content: error?.response
                    ? "The assistant couldn't answer just now. Please try again."
                    : "Couldn't reach the assistant. Check your connection, then try again.",
                timestamp: new Date(),
            }]);
        }
    }, [props.base64, makeAPICall, typeOut, stopTyping]);

    const askSuggestion = useCallback((text) => {
        if (busy) return;
        setUsed(prev => (prev.includes(text) ? prev : [...prev, text]));
        ask(text);
    }, [ask, busy]);

    const handleRetry = useCallback((errMessage) => {
        if (busy) return;
        // Drop the error and the question it belongs to, then ask again.
        setMessages(prev => {
            const i = prev.indexOf(errMessage);
            if (i < 0) return prev;
            const start = i > 0 && prev[i - 1].type === 'user' && prev[i - 1].content === errMessage.question ? i - 1 : i;
            return [...prev.slice(0, start), ...prev.slice(i + 1)];
        });
        ask(errMessage.question);
    }, [ask, busy]);

    const handleChatSubmit = useCallback((e) => {
        e?.preventDefault();
        const msg = inputValue.trim();
        if (!msg || busy) return;
        setInputValue('');
        ask(msg);
    }, [inputValue, busy, ask]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleChatSubmit();
        }
    }, [handleChatSubmit]);

    const hasMessages = messages.length > 0;
    const unusedSuggestions = SUGGESTIONS.filter((s) => !used.includes(s.text));
    const lastIndex = messages.length - 1;

    return (
        <div>
            {props.base64 ? (
                <Tooltip placement="left-end" title="Ask AI Assistant">
                    <IconButton
                        ref={buttonRef}
                        aria-label="Ask AI assistant"
                        aria-expanded={open}
                        sx={{
                            backgroundColor: '#2757aa',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            animation: open ? 'none' : 'pulse 2s infinite',
                            '@keyframes pulse': {
                                '0%': { boxShadow: '0 0 0 0 rgba(39, 87, 170, 0.45)' },
                                '70%': { boxShadow: '0 0 0 12px rgba(39, 87, 170, 0)' },
                                '100%': { boxShadow: '0 0 0 0 rgba(39, 87, 170, 0)' },
                            },
                            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                            '&:hover': { backgroundColor: '#1a3a7a' },
                        }}
                        onClick={handleOpen}
                    >
                        <HiSparkles style={{ fontSize: 22, color: '#fff' }} />
                    </IconButton>
                </Tooltip>
            ) : null}

            <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                <section
                    className={`aia-panel${dock ? ' aia-docked' : ''}`}
                    role="dialog"
                    aria-modal="false"
                    aria-labelledby={titleId}
                    style={dock ? { left: dock.left, width: dock.width, right: 'auto' } : undefined}
                >
                    {/* Header */}
                    <header className="aia-header">
                        <HiSparkles className="aia-header-icon" aria-hidden />
                        <h2 id={titleId} className="aia-title">AI assistant</h2>
                        {props.filename && <span className="aia-subtitle" title={props.filename}>• {props.filename}</span>}
                        <span className="aia-grow" />
                        {hasMessages && (
                            <Tooltip title="New chat">
                                <IconButton onClick={clearChat} aria-label="New chat" size="small" className="aia-head-btn">
                                    <FaPenToSquare size={15} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Close">
                            <IconButton onClick={handleClose} aria-label="Close AI assistant" size="small" className="aia-head-btn">
                                <FaTimes size={15} />
                            </IconButton>
                        </Tooltip>
                    </header>

                    {/* Document */}
                    <div className="aia-docline">
                        <span className="aia-pdf" aria-hidden>PDF</span>
                        <div className="aia-docline-text">
                            <b title={fileLabel}>{fileLabel}</b>
                            <span>Answers come from this document only</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="aia-body" aria-live="polite">
                        {!hasMessages && (
                            <div className="aia-hello">
                                <Spark size="lg" />
                                <h3>Ask about this document</h3>
                                <p>Pick a question or type your own.</p>
                                <div className="aia-sugs">
                                    {SUGGESTIONS.map(({ text, icon: Icon }) => (
                                        <button key={text} type="button" className="aia-sug" onClick={() => askSuggestion(text)} disabled={busy}>
                                            <Icon className="aia-sug-icon" aria-hidden />
                                            <span>{text}</span>
                                            <FaChevronRight className="aia-sug-go" aria-hidden />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            message.type === 'user' ? (
                                <div key={`${message.timestamp.getTime()}-${index}`} className="aia-msg-u">{message.content}</div>
                            ) : (
                                <AssistantMessage
                                    key={`${message.timestamp.getTime()}-${index}`}
                                    message={message}
                                    typing={typing && index === lastIndex}
                                    onRetry={handleRetry}
                                />
                            )
                        ))}

                        {loading && (
                            <div className="aia-thinking">
                                <Spark />
                                <span className="aia-dots" aria-hidden><span /><span /><span /></span>
                                Reading the document…
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Composer */}
                    <form onSubmit={handleChatSubmit} className="aia-foot">
                        {hasMessages && unusedSuggestions.length > 0 && (
                            <div className="aia-chips">
                                {unusedSuggestions.map((s) => (
                                    <button key={s.text} type="button" className="aia-chip" title={s.text} onClick={() => askSuggestion(s.text)} disabled={busy}>
                                        {s.short}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="aia-box">
                            <textarea
                                ref={inputRef}
                                id="aia-input"
                                className="aia-input"
                                rows={1}
                                aria-label="Ask a question about this document"
                                placeholder={hasMessages ? 'Ask a follow-up…' : 'Ask a question about this document…'}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            {busy ? (
                                <button type="button" className="aia-stop" onClick={stopAll}>
                                    <i aria-hidden /> Stop
                                </button>
                            ) : (
                                <button type="submit" className="aia-send" disabled={!inputValue.trim()} aria-label="Send">
                                    <FaPaperPlane size={13} />
                                </button>
                            )}
                        </div>
                        <div className="aia-note">AI can make mistakes. Check important details in the document.</div>
                    </form>
                </section>
            </Slide>
        </div>
    );
});

Chatbot.displayName = 'Chatbot';

export default Chatbot;
