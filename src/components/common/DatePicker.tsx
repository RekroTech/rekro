"use client";

import { useId, useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isAfter, isBefore, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export interface DatePickerProps {
    label?: string;
    error?: string;
    helperText?: string;
    value?: string; // ISO date string (yyyy-MM-dd)
    onChange?: (value: string) => void;
    min?: string; // ISO date string (yyyy-MM-dd)
    max?: string; // ISO date string (yyyy-MM-dd)
    disabled?: boolean;
    fullWidth?: boolean;
    size?: "sm" | "md" | "lg";
    id?: string;
}

export function DatePicker({
    label,
    error,
    helperText,
    value,
    onChange,
    min,
    max,
    disabled = false,
    fullWidth = true,
    size = "md",
    id,
}: DatePickerProps) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => {
        if (value) return parseISO(value);
        if (min) return parseISO(min);
        return new Date();
    });
    const containerRef = useRef<HTMLDivElement>(null);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const minDate = min ? parseISO(min) : undefined;
    const maxDate = max ? parseISO(max) : undefined;
    const selectedDate = value ? parseISO(value) : undefined;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const isDateDisabled = (date: Date) => {
        if (minDate && isBefore(date, minDate)) return true;
        return !!(maxDate && isAfter(date, maxDate));
    };

    const handleDateClick = (date: Date) => {
        if (isDateDisabled(date) || disabled) return;
        const dateString = format(date, "yyyy-MM-dd");
        onChange?.(dateString);
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        setCurrentMonth(newMonth);
    };

    const handleNextMonth = () => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        setCurrentMonth(newMonth);
    };

    const displayValue = selectedDate ? format(selectedDate, "MMM d, yyyy") : "";

    const sizeClasses = {
        sm: "px-3 py-2.5 text-sm min-h-[36px]",
        md: "px-4 py-2.5 text-base min-h-[44px]",
        lg: "px-5 py-3.5 text-lg min-h-[48px]",
    };

    const errorClass = error
        ? "border-danger-500 not-disabled:focus:border-danger-600 not-disabled:hover:border-danger-400"
        : "not-disabled:focus:border-transparent not-disabled:hover:border-text-muted";

    const focusClass = error
        ? "not-disabled:focus:ring-2 not-disabled:focus:ring-danger-500"
        : "not-disabled:focus:ring-2 not-disabled:focus:ring-primary-500";

    return (
        <div className={clsx(fullWidth && "w-full")} ref={containerRef}>
            <div className="relative">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="absolute left-3 px-1.5 bg-card text-xs font-medium text-text-subtle -translate-y-1/2 z-1 pointer-events-none"
                    >
                        {label}
                    </label>
                )}
                <button
                    type="button"
                    id={inputId}
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={clsx(
                        "bg-card border border-border text-foreground placeholder:text-text-subtle outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-left",
                        sizeClasses[size],
                        errorClass,
                        focusClass,
                        fullWidth && "w-full",
                        "pr-10"
                    )}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    aria-describedby={
                        error
                            ? `${inputId}-error`
                            : helperText
                              ? `${inputId}-helper`
                              : undefined
                    }
                >
                    {displayValue || <span className="text-text-subtle">Select date</span>}
                </button>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <Calendar size={18} />
                </div>

                {isOpen && !disabled && (
                    <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4 min-w-[320px]">
                        {/* Month navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 hover:bg-surface-subtle rounded transition-colors"
                                aria-label="Previous month"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="text-sm font-semibold">
                                {format(currentMonth, "MMMM yyyy")}
                            </div>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 hover:bg-surface-subtle rounded transition-colors"
                                aria-label="Next month"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Day names */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                                <div
                                    key={day}
                                    className="text-xs font-medium text-text-muted text-center py-1"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, index) => {
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isDisabled = isDateDisabled(day);
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleDateClick(day)}
                                        disabled={isDisabled}
                                        className={clsx(
                                            "p-2 text-sm rounded transition-colors",
                                            isSelected &&
                                                "bg-primary-500 text-white font-semibold",
                                            !isSelected && !isDisabled && isCurrentMonth &&
                                                "hover:bg-surface-subtle",
                                            !isSelected && isToday && isCurrentMonth &&
                                                "font-semibold text-primary-600",
                                            !isCurrentMonth && !isDisabled &&
                                                "text-text-muted opacity-50",
                                            isDisabled &&
                                                "text-text-subtle opacity-30 cursor-not-allowed"
                                        )}
                                    >
                                        {format(day, "d")}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p
                    id={`${inputId}-error`}
                    className="mt-1.5 text-sm text-danger-500"
                    role="alert"
                >
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-text-muted">
                    {helperText}
                </p>
            )}
        </div>
    );
}




