'use client';

import { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parse } from "date-fns";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import { Input } from "./Input";

export interface DateTimePickerProps {
  value: string; // expects format: yyyy-MM-ddTHH:mm
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({ value, onChange, placeholder = "Set Deadline", className }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Format helper
  const serializeDate = (date: Date, timeStr: string) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    return `${formattedDate}T${timeStr}`;
  };

  const selectedDate = value ? new Date(value) : null;
  const time = selectedDate ? format(selectedDate, "HH:mm") : "12:00";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateClick = (day: Date) => {
    onChange(serializeDate(day, time));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (selectedDate) {
      onChange(serializeDate(selectedDate, newTime));
    } else {
      onChange(serializeDate(new Date(), newTime));
    }
  };

  // Month traversal
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Calendar rendering math
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  return (
    <div className={`relative ${className || ""}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-5 py-3 border border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
      >
        <CalendarIcon className="w-4 h-4 mr-2 text-indigo-500" />
        <span className={selectedDate ? "text-slate-900 dark:text-white" : "text-slate-400"}>
          {selectedDate ? format(selectedDate, "PPP p") : placeholder}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-80 animate-in fade-in zoom-in duration-200"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <div className="flex space-x-1">
                <button type="button" onClick={prevMonth} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                <button type="button" onClick={nextMonth} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Days Calendar */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((wd, i) => (
                <span key={i} className="text-xs font-medium text-slate-400 dark:text-slate-500 py-1">
                  {wd}
                </span>
              ))}
            </div>

            <div className="space-y-1">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-7 gap-1">
                  {row.map((dt, dayIndex) => {
                    const isSelected = selectedDate && isSameDay(dt, selectedDate);
                    const isCurrentMonth = isSameMonth(dt, currentMonth);

                    return (
                      <button
                        type="button"
                        key={dayIndex}
                        onClick={() => handleDateClick(dt)}
                        className={`
                          aspect-square flex items-center justify-center text-sm rounded-full transition cursor-pointer
                          ${!isCurrentMonth ? "text-slate-300 dark:text-slate-600" : "text-slate-700 dark:text-slate-300"}
                          ${isSelected ? "bg-indigo-600 text-white font-semibold hover:bg-indigo-700" : "hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"}
                        `}
                      >
                        {format(dt, "d")}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Time input */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4 mr-1 text-indigo-500" /> Time
              </div>
              <input
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="px-2 py-1 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="mt-3 flex justify-end">
                <Button type="button" onClick={() => setIsOpen(false)} className="py-1 px-3 text-xs">Done</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
