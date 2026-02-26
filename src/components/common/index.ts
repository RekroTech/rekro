/**
 * Common UI Components Index
 * These components can be used in both server and client components
 * unless they contain client-only features (e.g., event handlers)
 *
 * Usage:
 * import { Button, Input, Modal } from "@/components/common";
 * import type { ButtonProps, InputProps } from "@/components/common";
 */

// ============================================================================
// Form Components
// ============================================================================
export { Button } from "./Button";
export { Input } from "./Input";
export { Select } from "./Select";
export { Checkbox } from "./Checkbox";
export { Textarea } from "./Textarea";
export { Upload, UploadPresets } from "./Upload";
export { SegmentedControl } from "./SegmentedControl";

// ============================================================================
// Layout Components
// ============================================================================
export { Modal } from "./Modal";
export { Dropdown } from "./Dropdown";
export { Banner } from "./Banner";

// ============================================================================
// Display Components
// ============================================================================
export { Alert } from "./Alert";
export { Toast } from "./Toast";
export { Loader } from "./Loader";
export { Icon } from "./Icon";
export { Visual } from "./Visual";
export { BackButton } from "./BackButton";

// ============================================================================
// Specialized Components
// ============================================================================
export { Address } from "./Address";
export { MapView } from "./MapView";
export { LogoIcon, LogoText } from "./Logo";
export { RoleGuard, PermissionGuard } from "./RoleGuard";

// ============================================================================
// Type Exports
// ============================================================================
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";
export type { InputProps, InputVariant, InputSize } from "./Input";
export type { SelectProps, SelectOption, SelectSize } from "./Select";
export type { CheckboxProps, CheckboxSize } from "./Checkbox";
export type { TextareaProps } from "./Textarea";
export type { UploadProps } from "./Upload";
export type { SegmentedControlProps, SegmentedControlOption, SegmentedControlSize } from "./SegmentedControl";
export type { ModalProps } from "./Modal";
export type { DropdownProps, DropdownItem } from "./Dropdown";
export type { BannerProps, BannerVariant } from "./Banner";
export type { AlertProps, AlertVariant } from "./Alert";
export type { ToastProps, ToastType } from "./Toast";
export type { LoaderProps, LoaderSize } from "./Loader";
export type { IconProps, IconName } from "./Icon";
export type { PropertyMediaProps } from "./Visual";
export type { BackButtonProps } from "./BackButton";
