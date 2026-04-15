import { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, useEffect, useId, useMemo, useRef, useState } from 'react';

type MenuItem = {
  id: 'view-profile' | 'edit-profile-settings' | 'logout';
  label: string;
  onSelect: () => void;
};

type DashboardTopNavProfileMenuProps = {
  roleLabel: string;
  email: string;
  displayName?: string;
  onViewProfile: () => void;
  onEditProfileSettings: () => void;
  onLogout: () => void;
};

const MENU_ITEM_COUNT = 3;

const getDisplayNameFromEmail = (email: string): string => {
  const [localPart] = email.split('@');
  const words = localPart.split(/[._-]+/g).filter(Boolean);
  if (!words.length) {
    return 'Profile';
  }

  return words
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
};

const getAvatarInitials = (name: string): string => {
  const words = name.split(' ').filter(Boolean);
  if (!words.length) {
    return 'P';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
};

export function DashboardTopNavProfileMenu({
  roleLabel,
  email,
  displayName,
  onViewProfile,
  onEditProfileSettings,
  onLogout
}: DashboardTopNavProfileMenuProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const resolvedName = useMemo(() => displayName ?? getDisplayNameFromEmail(email), [displayName, email]);
  const avatarInitials = useMemo(() => getAvatarInitials(resolvedName), [resolvedName]);

  const items: MenuItem[] = useMemo(
    () => [
      { id: 'view-profile', label: 'View Profile', onSelect: onViewProfile },
      { id: 'edit-profile-settings', label: 'Edit Profile Settings', onSelect: onEditProfileSettings },
      { id: 'logout', label: 'Logout', onSelect: onLogout }
    ],
    [onEditProfileSettings, onLogout, onViewProfile]
  );

  const closeMenuAndRestoreFocus = () => {
    setIsOpen(false);
    setActiveIndex(0);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const node = event.target as Node;
      if (!menuRef.current?.contains(node) && !triggerRef.current?.contains(node)) {
        closeMenuAndRestoreFocus();
      }
    };

    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenuAndRestoreFocus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    itemRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  const openMenu = () => {
    setIsOpen(true);
    setActiveIndex(0);
  };

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openMenu();
      if (event.key === 'ArrowUp') {
        setActiveIndex(MENU_ITEM_COUNT - 1);
      }
    }
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % MENU_ITEM_COUNT);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + MENU_ITEM_COUNT) % MENU_ITEM_COUNT);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenuAndRestoreFocus();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      items[activeIndex]?.onSelect();
      closeMenuAndRestoreFocus();
    }
  };

  const onMenuItemClick = (event: ReactMouseEvent<HTMLButtonElement>, item: MenuItem, index: number) => {
    event.preventDefault();
    setActiveIndex(index);
    item.onSelect();
    closeMenuAndRestoreFocus();
  };

  return (
    <div className={`dashboard-profile-menu ${isOpen ? 'is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="dashboard-profile-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) {
            setActiveIndex(0);
          }
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="dashboard-profile-menu__avatar" aria-hidden="true">
          {avatarInitials}
        </span>
        <span className="dashboard-profile-menu__identity">
          <strong>{resolvedName}</strong>
          <small>
            {roleLabel} • {email}
          </small>
        </span>
      </button>

      {isOpen ? (
        <div ref={menuRef} id={menuId} className="dashboard-profile-menu__panel" role="menu" aria-label="Profile options" onKeyDown={onMenuKeyDown}>
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitem"
              tabIndex={activeIndex === index ? 0 : -1}
              className={`dashboard-profile-menu__item ${activeIndex === index ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={(event) => onMenuItemClick(event, item, index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
