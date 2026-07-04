"use client"

import React, { useEffect } from 'react'
import { Brain, ArrowUpRight, TrendingUp, AlertTriangle, Target, MessageSquare, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { Learning } from '@/lib/data/learnings'
import { motion } from 'framer-motion'

export default function MemoryPage() {
  const { 
    learnings, 
    learningsPagination, 
    isFetchingLearnings, 
    fetchLearnings 
  } = useDashboardStore()

  useEffect(() => {
    fetchLearnings(1, 10)
  }, [])

  const handlePageChange = (newPage: number) => {
    fetchLearnings(newPage, 10)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-6 text-foreground pb-12">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Brain className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent" /> AI Memory & Learnings
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            This is where the AI Learner agent stores its accumulated knowledge. Every time a campaign hits a milestone, the AI analyzes the replies, finds patterns, and updates these insights to improve future strategies.
          </p>
        </div>
      </div>

      {isFetchingLearnings ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : learnings.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">No Learnings Yet</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The Learner agent hasn't generated any insights yet. It will automatically analyze campaigns once enough emails are sent and replies are received.
          </p>
        </div>
      ) : (
        <>
          {/* Masonry Grid */}
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
            {learnings.map((learning: Learning, index: number) => (
              <motion.div 
                key={learning._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="break-inside-avoid bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden group hover:border-accent/30 transition-all"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-border/50 bg-background/30 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-accent mb-1 block">
                      Campaign Snapshot
                    </span>
                    <h3 className="text-base font-semibold text-foreground">
                      {typeof learning.campaignId === 'object' ? learning.campaignId.name : 'Unknown Campaign'}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(learning.generatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reply Rate</div>
                      <div className="text-lg font-bold text-emerald-400">{learning.metrics.replyRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Positive</div>
                      <div className="text-lg font-bold text-accent">{learning.metrics.positiveRate.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Insights Section */}
                  <div className="space-y-4">
                    {learning.insights.workingAngles?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Working Angles
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {learning.insights.workingAngles.map((angle, i) => (
                            <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] rounded-md leading-tight">
                              {angle}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {learning.insights.failingAngles?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Failing Angles
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {learning.insights.failingAngles.map((angle, i) => (
                            <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] rounded-md leading-tight">
                              {angle}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {learning.insights.icpRefinements?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                          <Target className="w-3.5 h-3.5 text-purple-400" /> ICP Refinements
                        </h4>
                        <ul className="space-y-1.5">
                          {learning.insights.icpRefinements.map((refinement, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <ArrowUpRight className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{refinement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Sample Replies */}
                  {learning.sampleReplies?.length > 0 && (
                    <div className="pt-4 border-t border-border/50 space-y-3">
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Key Objection Handled
                      </h4>
                      <div className="bg-background/80 rounded-xl p-3 border border-border space-y-3">
                        <div className="flex items-start gap-3 justify-between">
                          <div className="text-xs text-muted-foreground border-l-2 border-border pl-2 italic">
                            "{learning.sampleReplies[0].ourEmailSnippet}"
                          </div>
                          <div className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-bold uppercase rounded-sm shrink-0">
                            {learning.sampleReplies[0].intent}
                          </div>
                        </div>
                        <div className="text-xs text-foreground bg-blue-500/5 p-2 rounded border border-blue-500/10 leading-relaxed">
                          "{learning.sampleReplies[0].replySnippet}"
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {learningsPagination && learningsPagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => handlePageChange(learningsPagination.page - 1)}
                disabled={learningsPagination.page === 1}
                className="flex items-center gap-1 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-accent/10 hover:text-accent disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-muted-foreground font-medium">
                Page {learningsPagination.page} of {learningsPagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(learningsPagination.page + 1)}
                disabled={learningsPagination.page === learningsPagination.pages}
                className="flex items-center gap-1 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-accent/10 hover:text-accent disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
