import type { LucideIcon, LucideProps } from "lucide-react";
import React from "react";
import { clsx } from "clsx";

export type SvgIcon = React.FC<LucideProps>;

type IconBreakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

export interface ResponsiveIconSize {
    base: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
}

export interface IconProps {
    icon: LucideIcon | SvgIcon;
    size?: number | ResponsiveIconSize;
    className?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
}

const BREAKPOINT_ORDER: IconBreakpoint[] = ["sm", "md", "lg", "xl", "2xl"];

const BREAKPOINT_CLASSES: Record<IconBreakpoint, { show: string; hide: string }> = {
    sm: { show: "sm:block", hide: "sm:hidden" },
    md: { show: "md:block", hide: "md:hidden" },
    lg: { show: "lg:block", hide: "lg:hidden" },
    xl: { show: "xl:block", hide: "xl:hidden" },
    "2xl": { show: "2xl:block", hide: "2xl:hidden" },
};

const isResponsiveSize = (size: number | ResponsiveIconSize): size is ResponsiveIconSize => {
    return typeof size === "object" && size !== null;
};

export const Icon = ({
    icon: IconComponent,
    size = 20,
    className,
    fill = "none",
    stroke = "currentColor",
    strokeWidth,
}: IconProps) => {
    if (!isResponsiveSize(size)) {
        return (
            <IconComponent
                size={size}
                className={className}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
        );
    }

    const activeBreakpoints = BREAKPOINT_ORDER.filter((breakpoint) => size[breakpoint] !== undefined);

    const renderClasses = (breakpoint: "base" | IconBreakpoint) => {
        if (breakpoint === "base") {
            const firstBreakpoint = activeBreakpoints[0];
            return firstBreakpoint ? BREAKPOINT_CLASSES[firstBreakpoint].hide : undefined;
        }

        const index = activeBreakpoints.indexOf(breakpoint);
        const nextBreakpoint = activeBreakpoints[index + 1];
        return clsx(
            "hidden",
            BREAKPOINT_CLASSES[breakpoint].show,
            nextBreakpoint && BREAKPOINT_CLASSES[nextBreakpoint].hide
        );
    };

    return (
        <>
            <IconComponent
                size={size.base}
                className={clsx(className, renderClasses("base"))}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
            {activeBreakpoints.map((breakpoint) => (
                <IconComponent
                    key={breakpoint}
                    size={size[breakpoint] as number}
                    className={clsx(className, renderClasses(breakpoint))}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                />
            ))}
        </>
    );
};

// Furniture icons for property/unit features that are not available in Lucide.
const baseFurnitureSvgProps = (
    size: LucideProps["size"],
    className: LucideProps["className"],
    stroke: LucideProps["stroke"],
    strokeWidth: LucideProps["strokeWidth"],
    fill: LucideProps["fill"],
    viewBox = "0 0 24 24",
) => ({
    xmlns: "http://www.w3.org/2000/svg",
    width: size ?? 20,
    height: size ?? 20,
    viewBox,
    className,
    fill: fill ?? "none",
    stroke: stroke ?? "currentColor",
    strokeWidth: strokeWidth ?? 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
});

export const BedsideTableIcon = ({
    size = 20,
    className,
    stroke,
    strokeWidth,
    fill,
}: LucideProps) => (
    <svg {...baseFurnitureSvgProps(size, className, stroke, strokeWidth, fill, "0 0 32 28")}>
        <path d="M1.682 3.773h28.636V1.045H1.682zM2.647 13.318H29.33V3.773H2.647zM2.647 22.864H29.33v-9.546H2.647zM2.647 22.864v3.92M29.33 22.864v3.92M14.648 6.5h2.672M14.648 16.045h2.672" />
    </svg>
);

export const ChairIcon = ({
    size = 20,
    className,
    stroke,
    strokeWidth,
    fill,
}: LucideProps) => (
    <svg {...baseFurnitureSvgProps(size, className, stroke, strokeWidth, fill, "0 0 29 36")}>
        <path d="M14.304 15.783c7.118 0 7.392-1.417 7.392-4.435C21.696 8.329 20.12 1 14.304 1S6.913 8.33 6.913 11.348c0 3.018.274 4.435 7.391 4.435zm6.653 8.87H7.652a2.217 2.217 0 1 1 0-4.436h13.305a2.217 2.217 0 1 1 0 4.435zm-9.61-8.87v4.434m5.914 0v-4.434m5.913 17.739a1.478 1.478 0 1 1-2.956 0 1.478 1.478 0 0 1 2.956 0zm-14.783 0a1.478 1.478 0 1 1-2.955 0 1.478 1.478 0 0 1 2.955 0zm-1.478-1.479h14.783m4.434-17.739v5.913c0 2.587-2.71 4.435-5.173 4.435m3.695-10.348h2.957m-25.13 0v5.913c0 2.587 2.709 4.435 5.173 4.435M3.957 14.304H1m11.826 10.348v7.391m2.957-7.39v7.39m0 1.479a1.478 1.478 0 1 1-2.956 0 1.478 1.478 0 0 1 2.956 0z" />
    </svg>
);

export const DeskIcon = ({
    size = 20,
    className,
    stroke,
    strokeWidth,
    fill,
}: LucideProps) => (
    <svg {...baseFurnitureSvgProps(size, className, stroke, strokeWidth, fill, "0 0 36 20")}>
        <path d="M1 19.214V1h34v18.214H21.696V1M1 7.071h34m-13.304 6.072H35m-7.391-9.107h1.478m-1.478 6.071h1.478m-1.478 6.072h1.478" />
    </svg>
);

export const WardrobeIcon = ({
    size = 20,
    className,
    stroke,
    strokeWidth,
    fill,
}: LucideProps) => (
    <svg {...baseFurnitureSvgProps(size, className, stroke, strokeWidth, fill, "0 0 32 33")}>
        <path d="M1.654 3.577h28.77V.962H1.653zM2.962 27.115h13.076V3.577H2.962zM16.038 27.115h13.077V3.577H16.038zM2.962 27.115v5.068M29.115 27.115v5.068M13.423 14.147v2.562M18.654 14.147v2.562" />
    </svg>
);

export const DrawersIcon = ({
    size = 20,
    className,
    stroke,
    strokeWidth,
    fill,
}: LucideProps) => (
    <svg {...baseFurnitureSvgProps(size, className, stroke, strokeWidth, fill, "0 0 30 36")}>
        <path d="M15.069 16.241h1.34m-1.34-9.379h1.34m-1.34 18.759h1.34M1.67 31.65V35m26.798-3.35V35M1.67 13.562h26.798M1.67 22.94h26.798M1.67 31.65h26.798V3.511H1.67V31.65zM1 3.68h28.138V1H1v2.68z" />
    </svg>
);


// ── Social icons ─────────────────────────────────────────────────────────────

export const WhatsAppIcon = ({ size = 20, className }: LucideProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

export const FacebookIcon = ({ size = 20, className }: LucideProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

export const XIcon = ({ size = 20, className }: LucideProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

export const GoogleIcon = ({ size = 20, className }: LucideProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.5-5.5 3.5-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.5 14.7 1.7 12 1.7 6.6 1.7 2.2 6.2 2.2 11.7s4.4 10 9.8 10c5.6 0 9.3-4 9.3-9.6 0-.7-.1-1.2-.2-1.9H12z"
            fill="#FFC107"
        />
        <path
            d="M3.3 7.1l3.2 2.3c.9-2.5 3.2-4.2 5.5-4.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.5 14.7 1.7 12 1.7c-3.8 0-7.2 2.2-8.7 5.4z"
            fill="#FF3D00"
        />
        <path
            d="M12 21.7c2.6 0 4.8-.8 6.4-2.3l-3-2.5c-.8.6-1.9 1-3.4 1-3.9 0-5.1-2.7-5.4-3.8l-3.1 2.4C5 19.6 8.2 21.7 12 21.7z"
            fill="#4CAF50"
        />
        <path
            d="M21.3 12.1c0-.7-.1-1.2-.2-1.9H12v3.9h5.5c-.3 1.3-1 2.3-2.1 2.9l3 2.5c1.7-1.5 2.9-3.9 2.9-7.4z"
            fill="#1976D2"
        />
    </svg>
);

