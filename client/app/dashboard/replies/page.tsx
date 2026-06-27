"use client"

import React, { useState } from 'react';
import { Search, Inbox, Send, Edit2, CheckCircle2, UserCircle2, Clock, ArrowLeft } from 'lucide-react';

import { intentStyles, Reply } from '@/lib/data/replies';

export default function RepliesPage() {
  const [selectedReplyId, setSelectedReplyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [replies, setReplies] = useState<Reply[]>([]);

  const filtered = replies.filter(r =>
    r.leadName.toLowerCase().includes(search.toLowerCase()) ||
    r.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedReply = replies.find(r => r.id === selectedReplyId);

  return (
    <div className="flex flex-col gap-5 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border rounded-xl p-4 md:p-6 shrink-0">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-0.5">Inbox Replies</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Review AI-classified replies and approve draft responses.</p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex h-[calc(100dvh-260px)] min-h-[400px]">

          {/* Inbox List — hidden on mobile when a reply is selected */}
          <div className={`${selectedReplyId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[300px] lg:w-[340px] border-r border-border shrink-0`}>
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search inbox..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(reply => {
                const intentStyle = intentStyles[reply.intent];
                const isSelected = reply.id === selectedReplyId;
                return (
                  <div
                    key={reply.id}
                    onClick={() => setSelectedReplyId(reply.id)}
                    className={`p-4 border-b border-border/50 cursor-pointer transition-colors border-l-2 ${isSelected ? 'bg-accent/5 border-l-accent' : 'hover:bg-foreground/2 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm truncate">{reply.leadName}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{reply.receivedAt}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 truncate">{reply.companyName}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${intentStyle.bg} ${intentStyle.text}`}>
                        {intentStyle.label}
                      </span>
                      {!reply.humanReviewed && (
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" title="Needs Review" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{reply.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Message View */}
          {selectedReply ? (
            <div className={`${selectedReplyId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 overflow-hidden`}>
              {/* Thread Header */}
              <div className="p-4 md:p-5 border-b border-border flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedReplyId(null)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <UserCircle2 className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-base font-semibold truncate">{selectedReply.leadName}</h3>
                    <p className="text-xs text-muted-foreground truncate">{selectedReply.companyName}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block text-xs text-muted-foreground mb-1">AI Classification</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border border-border/50 ${intentStyles[selectedReply.intent].bg} ${intentStyles[selectedReply.intent].text}`}>
                    {intentStyles[selectedReply.intent].label} ({selectedReply.intentConfidence}%)
                  </span>
                </div>
              </div>

              {/* Thread Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
                <div className="bg-background border border-border rounded-xl p-4 self-start max-w-full md:max-w-[85%]">
                  <div className="flex justify-between items-center mb-2 gap-3">
                    <span className="text-sm font-semibold text-foreground">Incoming Message</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" /> {selectedReply.receivedAt}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedReply.body}</p>
                </div>

                <div className="mt-auto pt-2">
                  {selectedReply.draftResponse ? (
                    <div className="border-2 border-accent/30 bg-accent/5 rounded-xl overflow-hidden">
                      <div className="bg-background/80 px-4 py-2 border-b border-accent/20 flex justify-between items-center">
                        <span className="text-xs font-bold text-accent flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> AI Drafted Response
                        </span>
                        <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        className="w-full bg-transparent p-4 text-sm text-foreground resize-none focus:outline-none min-h-[120px]"
                        defaultValue={selectedReply.draftResponse}
                      />
                      <div className="bg-background/80 px-4 py-3 border-t border-accent/20 flex flex-col sm:flex-row justify-end gap-2">
                        <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg bg-background text-center">
                          Discard
                        </button>
                        <button className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-black bg-accent hover:bg-accent/80 transition-colors rounded-lg">
                          <Send className="w-4 h-4" /> Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl overflow-hidden bg-background focus-within:border-accent/50 transition-colors">
                      <textarea
                        className="w-full bg-transparent p-4 text-sm text-foreground resize-none focus:outline-none min-h-[100px]"
                        placeholder="Type your reply..."
                      />
                      <div className="bg-secondary/50 px-4 py-3 border-t border-border flex justify-end">
                        <button className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-black bg-foreground hover:bg-foreground/90 transition-colors rounded-lg">
                          <Send className="w-4 h-4" /> Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <Inbox className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Select a conversation to view.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
