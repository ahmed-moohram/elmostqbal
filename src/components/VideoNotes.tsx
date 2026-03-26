'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStickyNote, FaPlus, FaEdit, FaTrash, FaClock, FaBookmark, FaTimes } from 'react-icons/fa';

interface Note {
  id: string;
  timestamp: number;
  text: string;
  createdAt: Date;
  isBookmark?: boolean;
}

interface VideoNotesProps {
  videoId: string;
  currentTime: number;
  onSeekTo: (time: number) => void;
}

export default function VideoNotes({ videoId, currentTime, onSeekTo }: VideoNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'notes' | 'bookmarks'>('all');

  useEffect(() => {
    // Load notes from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const savedNotes = localStorage.getItem(`notes_${videoId}`);
      if (savedNotes) {
        try {
          setNotes(JSON.parse(savedNotes));
        } catch (error) {
          console.error('Error loading notes:', error);
        }
      }
    }
  }, [videoId]);

  const saveNotes = (updatedNotes: Note[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`notes_${videoId}`, JSON.stringify(updatedNotes));
        setNotes(updatedNotes);
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    }
  };

  const addNote = (isBookmark = false) => {
    if (!newNote.trim() && !isBookmark) return;

    const note: Note = {
      id: Date.now().toString(),
      timestamp: Math.floor(currentTime),
      text: newNote || 'إشارة مرجعية',
      createdAt: new Date(),
      isBookmark
    };

    saveNotes([...notes, note]);
    setNewNote('');
  };

  const updateNote = (id: string, text: string) => {
    saveNotes(notes.map(note => note.id === id ? { ...note, text } : note));
    setEditingNote(null);
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(note => note.id !== id));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredNotes = notes.filter(note => {
    if (filter === 'notes') return !note.isBookmark;
    if (filter === 'bookmarks') return note.isBookmark;
    return true;
  }).sort((a, b) => a.timestamp - b.timestamp);

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-accent text-white rounded-full shadow-xl flex items-center justify-center"
      >
        {isOpen ? <FaTimes className="text-xl" /> : <FaStickyNote className="text-xl" />}
        {notes.length > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {notes.length}
          </span>
        )}
      </motion.button>

      {/* Notes Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-20 right-6 bottom-6 z-40 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FaStickyNote />
                  الملاحظات
                </h3>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-2">
                  <FaTimes />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                    filter === 'all' ? 'bg-white text-accent' : 'bg-white/20'
                  }`}
                >
                  الكل ({notes.length})
                </button>
                <button
                  onClick={() => setFilter('notes')}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                    filter === 'notes' ? 'bg-white text-accent' : 'bg-white/20'
                  }`}
                >
                  ملاحظات ({notes.filter(n => !n.isBookmark).length})
                </button>
                <button
                  onClick={() => setFilter('bookmarks')}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                    filter === 'bookmarks' ? 'bg-white text-accent' : 'bg-white/20'
                  }`}
                >
                  إشارات ({notes.filter(n => n.isBookmark).length})
                </button>
              </div>
            </div>

            {/* Add Note Form */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <FaClock className="text-accent" />
                <span className="text-sm font-medium">{formatTime(currentTime)}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNote()}
                  placeholder="اكتب ملاحظة..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addNote()}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <FaPlus />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addNote(true)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  title="إضافة إشارة مرجعية"
                >
                  <FaBookmark />
                </motion.button>
              </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaStickyNote className="text-5xl mx-auto mb-4 opacity-50" />
                  <p>لا توجد ملاحظات بعد</p>
                  <p className="text-sm mt-2">ابدأ بإضافة ملاحظات أثناء المشاهدة</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3 rounded-lg border-l-4 ${
                      note.isBookmark
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                        : 'bg-white dark:bg-gray-700 border-accent'
                    } shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <button
                        onClick={() => onSeekTo(note.timestamp)}
                        className="flex items-center gap-2 text-sm text-accent hover:text-purple-600 font-medium"
                      >
                        <FaClock className="text-xs" />
                        {formatTime(note.timestamp)}
                      </button>
                      <div className="flex gap-1">
                        {editingNote === note.id ? (
                          <button
                            onClick={() => setEditingNote(null)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingNote(note.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </div>

                    {editingNote === note.id ? (
                      <input
                        type="text"
                        defaultValue={note.text}
                        onBlur={(e) => updateNote(note.id, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && updateNote(note.id, (e.target as HTMLInputElement).value)}
                        autoFocus
                        className="w-full px-2 py-1 border border-accent rounded bg-white dark:bg-gray-800 focus:outline-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300">{note.text}</p>
                    )}

                    {note.isBookmark && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                        <FaBookmark className="text-xs" />
                        إشارة مرجعية
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {filteredNotes.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  اضغط على الوقت للانتقال إلى تلك اللحظة في الفيديو
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
