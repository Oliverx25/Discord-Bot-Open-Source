/* @ds-bundle: {"format":4,"namespace":"TobotDesignSystem_715bd9","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"LogRow","sourcePath":"components/data/LogRow.jsx"},{"name":"Progress","sourcePath":"components/data/Progress.jsx"},{"name":"Stat","sourcePath":"components/data/Stat.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"ChannelPicker","sourcePath":"components/forms/ChannelPicker.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Slider","sourcePath":"components/forms/Slider.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"TimezoneSelect","sourcePath":"components/forms/TimezoneSelect.jsx"},{"name":"PricingTier","sourcePath":"components/marketing/PricingTier.jsx"},{"name":"Ticker","sourcePath":"components/marketing/Ticker.jsx"},{"name":"Accordion","sourcePath":"components/navigation/Accordion.jsx"},{"name":"CommandPalette","sourcePath":"components/navigation/CommandPalette.jsx"},{"name":"Menu","sourcePath":"components/navigation/Menu.jsx"},{"name":"NavItem","sourcePath":"components/navigation/NavItem.jsx"},{"name":"Stepper","sourcePath":"components/navigation/Stepper.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"EmbedPreview","sourcePath":"components/product/EmbedPreview.jsx"},{"name":"ModuleCard","sourcePath":"components/product/ModuleCard.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"bd8fec1ee26c","components/core/Button.jsx":"bc5ad8dfd1de","components/core/Card.jsx":"60b2709195c7","components/core/IconButton.jsx":"74a0dff71156","components/core/Tag.jsx":"9d5e70664a46","components/data/Avatar.jsx":"fbbcf2c9a23b","components/data/LogRow.jsx":"e72e3bec7bbb","components/data/Progress.jsx":"23ae862915f2","components/data/Stat.jsx":"20bd4f247f9c","components/data/Table.jsx":"1604d60f015a","components/feedback/Alert.jsx":"ab00d799ac2e","components/feedback/Dialog.jsx":"cf897c787999","components/feedback/EmptyState.jsx":"36100f915fa0","components/feedback/Skeleton.jsx":"502b719d05da","components/feedback/Toast.jsx":"ed2cf6c45acd","components/feedback/Tooltip.jsx":"1518214f050c","components/forms/ChannelPicker.jsx":"ef3895a15abc","components/forms/Checkbox.jsx":"173122b3afbf","components/forms/Input.jsx":"7e551dfb76be","components/forms/Radio.jsx":"714311a85792","components/forms/Select.jsx":"81144b712d64","components/forms/Slider.jsx":"ad4aabd540df","components/forms/Switch.jsx":"5de1f74cd066","components/forms/TimezoneSelect.jsx":"b60260afe12d","components/marketing/PricingTier.jsx":"8e580c8cb43b","components/marketing/Ticker.jsx":"5c0574c40f6b","components/navigation/Accordion.jsx":"d5729c209f1c","components/navigation/CommandPalette.jsx":"f0824cc8ae3f","components/navigation/Menu.jsx":"6e24b552f98a","components/navigation/NavItem.jsx":"a8db6f052208","components/navigation/Stepper.jsx":"3ade5e709743","components/navigation/Tabs.jsx":"9b39eacc0627","components/product/EmbedPreview.jsx":"25aa7bc495e7","components/product/ModuleCard.jsx":"55d4227c84cb","ui_kits/dashboard/App.jsx":"fd089d759535","ui_kits/dashboard/BillingView.jsx":"ae453ba27e3a","ui_kits/dashboard/Chrome.jsx":"cddaf62748d0","ui_kits/dashboard/LogsView.jsx":"8762e93c2a09","ui_kits/dashboard/ModuleDetail.jsx":"83b9f1b8b215","ui_kits/dashboard/ModulesView.jsx":"17f5f0a5e429","ui_kits/marketing/Faq.jsx":"f0fbfce50132","ui_kits/marketing/Hero.jsx":"4fa97870b272","ui_kits/marketing/Modules.jsx":"c55780956755","ui_kits/marketing/Nav.jsx":"fb750224c710","ui_kits/marketing/Pricing.jsx":"162ba797acda","ui_kits/marketing/Shared.jsx":"a49fb4b50131"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TobotDesignSystem_715bd9 = window.TobotDesignSystem_715bd9 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
const bdTones = {
  neutral: {
    bg: 'var(--bg-hover)',
    fg: 'var(--text-secondary)',
    bd: 'var(--border-default)'
  },
  accent: {
    bg: 'var(--bg-tint-accent)',
    fg: 'var(--text-accent)',
    bd: 'var(--border-accent)'
  },
  success: {
    bg: 'var(--success-bg)',
    fg: 'var(--success)',
    bd: 'var(--success-border)'
  },
  warning: {
    bg: 'var(--warning-bg)',
    fg: 'var(--warning)',
    bd: 'var(--warning-border)'
  },
  danger: {
    bg: 'var(--danger-bg)',
    fg: 'var(--danger)',
    bd: 'var(--danger-border)'
  },
  info: {
    bg: 'var(--info-bg)',
    fg: 'var(--info)',
    bd: 'var(--info-border)'
  },
  free: {
    bg: 'var(--bg-hover)',
    fg: 'var(--text-secondary)',
    bd: 'var(--border-strong)'
  },
  pro: {
    bg: 'var(--accent)',
    fg: 'var(--on-accent)',
    bd: 'var(--accent)'
  }
};
function Badge({
  children,
  tone = 'neutral',
  size = 'md',
  dot = false,
  uppercase = true,
  style,
  ...rest
}) {
  const t = bdTones[tone];
  const sm = size === 'sm';
  const s = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    height: sm ? '18px' : '22px',
    padding: sm ? '0 6px' : '0 8px',
    background: t.bg,
    color: t.fg,
    border: '1px solid ' + t.bd,
    borderRadius: 'var(--radius-pill)',
    fontFamily: 'var(--font-mono)',
    fontSize: sm ? '10px' : '11px',
    fontWeight: 700,
    letterSpacing: uppercase ? 'var(--ls-overline)' : '.01em',
    textTransform: uppercase ? 'uppercase' : 'none',
    whiteSpace: 'nowrap',
    ...style
  };
  return React.createElement('span', {
    style: s,
    ...rest
  }, dot ? React.createElement('span', {
    key: 'd',
    style: {
      width: '5px',
      height: '5px',
      borderRadius: 'var(--radius-pill)',
      background: 'currentColor'
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const btnBase = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  fontFamily: 'var(--font-mono)',
  fontWeight: 700,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  transition: 'transform 90ms cubic-bezier(.2,.9,.1,1),box-shadow 90ms cubic-bezier(.2,.9,.1,1),background var(--dur-fast) var(--ease-standard),color var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)'
};
const btnSizes = {
  sm: {
    height: '32px',
    padding: '0 12px',
    fontSize: '11px'
  },
  md: {
    height: '38px',
    padding: '0 18px',
    fontSize: '12px'
  },
  lg: {
    height: '46px',
    padding: '0 24px',
    fontSize: '13px'
  }
};
const btnVariants = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--on-accent)',
    borderColor: 'var(--accent)',
    boxShadow: 'var(--shadow-hard)'
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-strong)',
    boxShadow: 'var(--shadow-hard-neutral)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    borderColor: 'transparent',
    boxShadow: 'none'
  },
  destructive: {
    background: 'transparent',
    color: 'var(--danger)',
    borderColor: 'var(--danger-border)',
    boxShadow: 'var(--shadow-hard-danger)'
  }
};
const btnHover = {
  primary: {
    background: 'var(--accent-hover)',
    borderColor: 'var(--accent-hover)'
  },
  secondary: {
    color: 'var(--text-accent)',
    borderColor: 'var(--accent)'
  },
  ghost: {
    background: 'var(--bg-hover)',
    color: 'var(--text-primary)'
  },
  destructive: {
    background: 'var(--danger-bg)'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  children,
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  as = 'button',
  onClick,
  href,
  type = 'button',
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const off = disabled || loading;
  const physical = variant !== 'ghost';
  const half = 'calc(var(--press-offset)) ';
  const s = {
    ...btnBase,
    ...btnSizes[size],
    ...btnVariants[variant],
    ...(hover && !off ? btnHover[variant] : null),
    ...(hover && !off && physical ? {
      transform: 'translate(2px,2px)',
      boxShadow: variant === 'primary' ? '2px 2px 0 var(--accent-shadow)' : variant === 'destructive' ? '2px 2px 0 var(--danger-shadow)' : '2px 2px 0 var(--border-subtle)'
    } : null),
    ...(down && !off && physical ? {
      transform: 'translate(4px,4px)',
      boxShadow: '0 0 0 transparent'
    } : null),
    ...(down && !off && !physical ? {
      transform: 'scale(var(--press-scale))'
    } : null),
    ...(off ? {
      opacity: .4,
      cursor: 'not-allowed',
      boxShadow: 'none'
    } : null),
    ...(fullWidth ? {
      width: '100%'
    } : null),
    ...style
  };
  const Tag = href ? 'a' : as;
  return React.createElement(Tag, {
    style: s,
    onClick: off ? undefined : onClick,
    href,
    type: Tag === 'button' ? type : undefined,
    disabled: Tag === 'button' ? off : undefined,
    'aria-busy': loading || undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    ...rest
  }, loading ? React.createElement(Spinner, {
    key: 'sp'
  }) : iconLeft, React.createElement('span', {
    key: 'l'
  }, children), iconRight);
}
function Spinner() {
  return React.createElement('span', {
    style: {
      width: '12px',
      height: '12px',
      borderRadius: 'var(--radius-pill)',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      display: 'inline-block',
      animation: 'tobot-spin 620ms linear infinite'
    }
  });
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  children,
  title,
  subtitle,
  actions,
  footer,
  padding = 'md',
  tone = 'default',
  interactive = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const pads = {
    none: '0',
    sm: 'var(--space-3)',
    md: 'var(--space-5)',
    lg: 'var(--space-6)'
  };
  const tones = {
    default: {
      background: 'var(--bg-surface)',
      borderColor: 'var(--border-subtle)'
    },
    raised: {
      background: 'var(--bg-raised)',
      borderColor: 'var(--border-default)',
      boxShadow: 'var(--shadow-1)'
    },
    accent: {
      background: 'var(--bg-tint-accent)',
      borderColor: 'var(--border-accent)'
    },
    inset: {
      background: 'var(--bg-inset)',
      borderColor: 'var(--border-subtle)'
    }
  };
  const s = {
    border: '1px solid',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-primary)',
    transition: 'border-color var(--dur-fast) var(--ease-standard),transform var(--dur-fast) var(--ease-out)',
    ...tones[tone],
    ...(interactive ? {
      cursor: 'pointer'
    } : null),
    ...(interactive && hover ? {
      borderColor: 'var(--border-strong)',
      transform: 'translateY(var(--lift-y))'
    } : null),
    ...style
  };
  const hasHeader = title || subtitle || actions;
  return React.createElement('div', {
    style: s,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    ...rest
  }, hasHeader ? React.createElement('div', {
    key: 'h',
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      padding: pads[padding],
      paddingBottom: children ? 'var(--space-3)' : pads[padding]
    }
  }, React.createElement('div', {
    key: 't'
  }, title ? React.createElement('div', {
    key: 't1',
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-h4)',
      letterSpacing: '-.005em'
    }
  }, title) : null, subtitle ? React.createElement('div', {
    key: 't2',
    style: {
      marginTop: 'var(--space-1)',
      fontSize: 'var(--text-body-s)',
      color: 'var(--text-secondary)'
    }
  }, subtitle) : null), actions ? React.createElement('div', {
    key: 'a',
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      flexShrink: 0
    }
  }, actions) : null) : null, children ? React.createElement('div', {
    key: 'b',
    style: {
      padding: pads[padding],
      paddingTop: hasHeader ? 0 : pads[padding]
    }
  }, children) : null, footer ? React.createElement('div', {
    key: 'f',
    style: {
      borderTop: '1px solid var(--border-subtle)',
      padding: pads[padding],
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, footer) : null);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
const ibSizes = {
  sm: '28px',
  md: '34px',
  lg: '40px'
};
const ibVariants = {
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    borderColor: 'transparent'
  },
  outline: {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-default)',
    boxShadow: 'var(--shadow-hard-neutral)'
  },
  solid: {
    background: 'var(--accent)',
    color: 'var(--on-accent)',
    borderColor: 'var(--accent)',
    boxShadow: 'var(--shadow-hard)'
  }
};
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  active = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const d = ibSizes[size];
  const s = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: d,
    height: d,
    border: '1px solid transparent',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? .4 : 1,
    transition: 'background var(--dur-fast) var(--ease-standard),color var(--dur-fast) var(--ease-standard)',
    ...ibVariants[variant],
    ...(active ? {
      background: 'var(--bg-tint-accent)',
      color: 'var(--text-accent)'
    } : null),
    ...(hover && !disabled ? {
      background: variant === 'solid' ? 'var(--accent-hover)' : 'var(--bg-hover)',
      color: variant === 'solid' ? 'var(--on-accent)' : 'var(--text-primary)'
    } : null),
    ...style
  };
  return React.createElement('button', {
    type: 'button',
    'aria-label': label,
    title: label,
    disabled,
    onClick,
    style: s,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    ...rest
  }, icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function Tag({
  children,
  onRemove,
  icon,
  mono = false,
  selected = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    height: '26px',
    padding: '0 8px',
    background: selected ? 'var(--bg-tint-agave)' : 'var(--bg-raised)',
    border: '1px solid ' + (selected ? 'var(--secondary)' : 'var(--border-default)'),
    borderRadius: 'var(--radius-sm)',
    color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: mono ? 400 : 500,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'border-color var(--dur-fast) var(--ease-standard),background var(--dur-fast) var(--ease-standard)',
    ...(hover && onClick ? {
      borderColor: 'var(--border-strong)'
    } : null),
    ...style
  };
  return React.createElement('span', {
    style: s,
    onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    ...rest
  }, icon, children, onRemove ? React.createElement('button', {
    key: 'x',
    type: 'button',
    'aria-label': 'Remove',
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    },
    style: {
      all: 'unset',
      cursor: 'pointer',
      lineHeight: 1,
      padding: '0 1px',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: '13px'
    }
  }, '\u00d7') : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/Avatar.jsx
try { (() => {
function Avatar({
  name = '',
  src,
  size = 28,
  shape = 'circle',
  status,
  mono = false,
  style
}) {
  const initials = String(name).replace(/^[@#]/, '').split(/[\s_-]+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  const box = {
    position: 'relative',
    display: 'inline-flex',
    flexShrink: 0,
    width: size + 'px',
    height: size + 'px',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: shape === 'circle' ? 'var(--radius-pill)' : 'var(--radius-sm)',
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-secondary)',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)',
    fontWeight: 700,
    fontSize: Math.max(9, Math.round(size * .38)) + 'px',
    ...style
  };
  const dot = {
    position: 'absolute',
    right: '-1px',
    bottom: '-1px',
    width: Math.max(7, size * .28) + 'px',
    height: Math.max(7, size * .28) + 'px',
    borderRadius: 'var(--radius-pill)',
    border: '2px solid var(--bg-base)',
    background: status === 'online' ? 'var(--success)' : status === 'idle' ? 'var(--warning)' : status === 'dnd' ? 'var(--danger)' : 'var(--coal-500)'
  };
  return React.createElement('span', {
    style: {
      position: 'relative',
      display: 'inline-flex'
    }
  }, React.createElement('span', {
    style: box,
    title: name
  }, src ? React.createElement('img', {
    src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials), status ? React.createElement('span', {
    style: dot
  }) : null);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data/LogRow.jsx
try { (() => {
const lrTone = {
  info: 'var(--text-secondary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  accent: 'var(--text-accent)'
};
function LogRow({
  time,
  event,
  tone = 'info',
  channel,
  actor,
  detail,
  onOpen,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return React.createElement('div', {
    onClick: onOpen,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'grid',
      gridTemplateColumns: '84px 148px 110px 118px 1fr',
      gap: 'var(--space-3)',
      alignItems: 'center',
      padding: '8px var(--space-4)',
      borderBottom: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      background: hover ? 'var(--bg-hover)' : 'transparent',
      cursor: onOpen ? 'pointer' : 'default',
      ...style
    }
  }, React.createElement('span', {
    key: 't',
    style: {
      color: 'var(--text-muted)'
    }
  }, time), React.createElement('span', {
    key: 'e',
    style: {
      color: lrTone[tone],
      fontWeight: 500
    }
  }, event), React.createElement('span', {
    key: 'c',
    style: {
      color: 'var(--text-secondary)'
    }
  }, channel), React.createElement('span', {
    key: 'a',
    style: {
      color: 'var(--text-secondary)'
    }
  }, actor), React.createElement('span', {
    key: 'd',
    style: {
      color: 'var(--text-primary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, detail));
}
Object.assign(__ds_scope, { LogRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/LogRow.jsx", error: String((e && e.message) || e) }); }

// components/data/Progress.jsx
try { (() => {
function Progress({
  value = 0,
  max = 100,
  label,
  valueLabel,
  tone = 'accent',
  size = 'md',
  indeterminate = false,
  variant = 'bar',
  segments = 10,
  style
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const colors = {
    accent: 'var(--accent)',
    jade: 'var(--secondary)',
    warning: 'var(--warning)',
    danger: 'var(--danger)'
  };
  const h = size === 'sm' ? 3 : size === 'lg' ? 8 : 5;
  const head = label || valueLabel ? React.createElement('div', {
    key: 'l',
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 'var(--text-caption)'
    }
  }, React.createElement('span', {
    key: 'a',
    style: {
      color: 'var(--text-secondary)'
    }
  }, label), React.createElement('span', {
    key: 'b',
    style: {
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, valueLabel)) : null;
  if (variant === 'segmented') {
    const filled = Math.round(pct / 100 * segments);
    const segH = size === 'sm' ? 10 : size === 'lg' ? 18 : 14;
    return React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        ...style
      }
    }, head, React.createElement('div', {
      key: 't',
      role: 'progressbar',
      'aria-valuenow': indeterminate ? undefined : value,
      'aria-valuemax': max,
      style: {
        display: 'flex',
        gap: '2px'
      }
    }, Array.from({
      length: segments
    }).map((_, i) => React.createElement('div', {
      key: i,
      style: {
        flex: 1,
        height: segH + 'px',
        borderRadius: '1px',
        background: i < filled ? colors[tone] : 'var(--bg-inset)',
        border: '1px solid ' + (i < filled ? colors[tone] : 'var(--border-subtle)'),
        transition: 'background var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)'
      }
    }))));
  }
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...style
    }
  }, head, React.createElement('div', {
    key: 't',
    role: 'progressbar',
    'aria-valuenow': indeterminate ? undefined : value,
    'aria-valuemax': max,
    style: {
      height: h + 'px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden'
    }
  }, React.createElement('div', {
    style: indeterminate ? {
      height: '100%',
      width: '34%',
      background: colors[tone],
      animation: 'tobot-indeterminate 1.1s ease-in-out infinite'
    } : {
      height: '100%',
      width: pct + '%',
      background: colors[tone],
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  })));
}
Object.assign(__ds_scope, { Progress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Progress.jsx", error: String((e && e.message) || e) }); }

// components/data/Stat.jsx
try { (() => {
function Stat({
  label,
  value,
  unit,
  delta,
  deltaTone = 'success',
  hint,
  size = 'md',
  style
}) {
  const big = size === 'lg';
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      ...style
    }
  }, React.createElement('div', {
    key: 'l',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      fontWeight: 700
    }
  }, label), React.createElement('div', {
    key: 'v',
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '6px'
    }
  }, React.createElement('span', {
    key: 'a',
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: big ? '34px' : '22px',
      lineHeight: 1.05,
      color: 'var(--text-primary)'
    }
  }, value), unit ? React.createElement('span', {
    key: 'u',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      color: 'var(--text-muted)'
    }
  }, unit) : null, delta ? React.createElement('span', {
    key: 'd',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      color: deltaTone === 'danger' ? 'var(--danger)' : deltaTone === 'muted' ? 'var(--text-muted)' : 'var(--success)'
    }
  }, delta) : null), hint ? React.createElement('div', {
    key: 'h',
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Stat.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
function Table({
  columns = [],
  rows = [],
  dense = false,
  mono = true,
  onRowClick,
  empty = 'Sin resultados',
  footer,
  style
}) {
  const grid = columns.map(c => c.width || '1fr').join(' ');
  const pad = dense ? '7px var(--space-3)' : '10px var(--space-4)';
  const head = {
    display: 'grid',
    gridTemplateColumns: grid,
    gap: 'var(--space-3)',
    padding: pad,
    background: 'var(--bg-raised)',
    borderBottom: '1px solid var(--border-default)'
  };
  const th = {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: 700
  };
  return React.createElement('div', {
    style: {
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--bg-surface)',
      ...style
    }
  }, React.createElement('div', {
    key: 'h',
    style: head
  }, columns.map((c, i) => React.createElement('span', {
    key: i,
    style: {
      ...th,
      textAlign: c.align || 'left'
    }
  }, c.header))), rows.length ? rows.map((r, ri) => React.createElement('div', {
    key: ri,
    onClick: onRowClick ? () => onRowClick(r, ri) : undefined,
    style: {
      display: 'grid',
      gridTemplateColumns: grid,
      gap: 'var(--space-3)',
      padding: pad,
      alignItems: 'center',
      borderBottom: ri === rows.length - 1 ? 'none' : '1px solid var(--border-subtle)',
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
      fontSize: mono ? 'var(--text-mono-s)' : 'var(--text-body-s)',
      cursor: onRowClick ? 'pointer' : 'default'
    }
  }, columns.map((c, ci) => React.createElement('span', {
    key: ci,
    style: {
      textAlign: c.align || 'left',
      color: c.muted ? 'var(--text-muted)' : 'var(--text-primary)',
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, c.render ? c.render(r) : r[c.key])))) : React.createElement('div', {
    key: 'e',
    style: {
      padding: 'var(--space-8)',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-body-s)'
    }
  }, empty), footer ? React.createElement('div', {
    key: 'f',
    style: {
      padding: pad,
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      color: 'var(--text-muted)'
    }
  }, footer) : null);
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
const alTone = {
  info: {
    fg: 'var(--info)',
    bd: 'var(--info-border)',
    bg: 'var(--info-bg)'
  },
  success: {
    fg: 'var(--success)',
    bd: 'var(--success-border)',
    bg: 'var(--success-bg)'
  },
  warning: {
    fg: 'var(--warning)',
    bd: 'var(--warning-border)',
    bg: 'var(--warning-bg)'
  },
  danger: {
    fg: 'var(--danger)',
    bd: 'var(--danger-border)',
    bg: 'var(--danger-bg)'
  }
};
function Alert({
  tone = 'info',
  title,
  children,
  icon,
  action,
  onDismiss,
  style
}) {
  const t = alTone[tone];
  return React.createElement('div', {
    role: 'note',
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start',
      padding: 'var(--space-3) var(--space-4)',
      background: t.bg,
      border: '1px solid ' + t.bd,
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, icon ? React.createElement('span', {
    key: 'i',
    style: {
      color: t.fg,
      display: 'flex',
      marginTop: '2px'
    }
  }, icon) : null, React.createElement('div', {
    key: 'c',
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title ? React.createElement('div', {
    key: 't',
    style: {
      fontSize: 'var(--text-body-s)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, title) : null, children ? React.createElement('div', {
    key: 'b',
    style: {
      marginTop: title ? '2px' : 0,
      fontSize: 'var(--text-caption)',
      color: 'var(--text-secondary)',
      lineHeight: 1.55
    }
  }, children) : null, action ? React.createElement('div', {
    key: 'a',
    style: {
      marginTop: 'var(--space-3)'
    }
  }, action) : null), onDismiss ? React.createElement('button', {
    key: 'x',
    type: 'button',
    'aria-label': 'Cerrar',
    onClick: onDismiss,
    style: {
      all: 'unset',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: '14px',
      lineHeight: 1
    }
  }, '\u00d7') : null);
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open = true,
  title,
  description,
  children,
  footer,
  onClose,
  width = 460,
  tone = 'default'
}) {
  if (!open) return null;
  const scrim = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5,7,5,.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
    zIndex: 60
  };
  const panel = {
    width: width + 'px',
    maxWidth: '100%',
    backgroundColor: 'var(--bg-raised)',
    backgroundImage: 'radial-gradient(circle at 1px 1px,var(--bg-raised) 1.1px,transparent 1.2px),linear-gradient(135deg,rgba(198,255,61,.12),rgba(198,255,61,0) 62%)',
    backgroundSize: '3px 3px,100% 100%',
    backgroundRepeat: 'repeat,no-repeat',
    border: '1px solid ' + (tone === 'danger' ? 'var(--danger-border)' : 'var(--border-default)'),
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-3)',
    animation: 'tobot-fade-up var(--dur-base) var(--ease-out)'
  };
  return React.createElement('div', {
    style: scrim,
    onClick: onClose
  }, React.createElement('div', {
    role: 'dialog',
    'aria-modal': true,
    style: panel,
    onClick: e => e.stopPropagation()
  }, React.createElement('div', {
    key: 'h',
    style: {
      padding: 'var(--space-6) var(--space-6) var(--space-4)'
    }
  }, React.createElement('div', {
    key: 't',
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-h3)',
      letterSpacing: '-.01em',
      color: 'var(--text-primary)'
    }
  }, title), description ? React.createElement('div', {
    key: 'd',
    style: {
      marginTop: 'var(--space-2)',
      fontSize: 'var(--text-body-s)',
      color: 'var(--text-secondary)',
      lineHeight: 1.6
    }
  }, description) : null), children ? React.createElement('div', {
    key: 'b',
    style: {
      padding: '0 var(--space-6) var(--space-4)'
    }
  }, children) : null, footer ? React.createElement('div', {
    key: 'f',
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-3)',
      padding: 'var(--space-4) var(--space-6) var(--space-6)',
      borderTop: '1px solid var(--border-subtle)',
      marginTop: 'var(--space-2)'
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
const TO_FACES = {
  idle: ['  ┌───────────┐', '  │  ◕   ◕  │', '  │     ▿     │', '  └──┬───┬──┘', '     ╰───╯'],
  work: ['  ┌───────────┐', '  │  ◔   ◔  │', '  │    ═══    │', '  └──┬───┬──┘', '     ╰───╯'],
  ok: ['  ┌───────────┐', '  │  ^   ^  │', '  │     ‿     │', '  └──┬───┬──┘', '     ╰───╯'],
  alert: ['  ┌───────────┐', '  │  ◉   ◉  │', '  │     ◇     │', '  └──┬───┬──┘', '     ╰───╯'],
  sleep: ['  ┌───────────┐', '  │  ─   ─  │', '  │     ·     │', '  └──┬───┬──┘', '     ╰───╯']
};
function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  mood = 'idle',
  mascot = true,
  celebrate = false,
  compact = false,
  style
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 'var(--space-4)',
      padding: compact ? 'var(--space-8)' : 'var(--space-12) var(--space-8)',
      ...style
    }
  }, mascot ? React.createElement('div', {
    key: 'm',
    style: {
      position: 'relative'
    }
  }, celebrate ? React.createElement('span', {
    key: 's',
    'aria-hidden': 'true',
    style: {
      position: 'absolute',
      top: '-6px',
      right: '14%',
      fontFamily: 'var(--font-mono)',
      fontSize: '16px',
      color: 'var(--accent)',
      animation: 'tobot-spark var(--dur-celebrate) var(--ease-spring) forwards'
    }
  }, '\u2726') : null, React.createElement('pre', {
    key: 'f',
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: compact ? '11px' : '13px',
      lineHeight: 1.25,
      color: 'var(--accent)',
      textShadow: '0 0 18px rgba(198,255,61,.30)'
    }
  }, (TO_FACES[mood] || TO_FACES.idle).join('\n'))) : null, React.createElement('div', {
    key: 't',
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-h3)',
      letterSpacing: '-.01em'
    }
  }, title), description ? React.createElement('p', {
    key: 'd',
    style: {
      margin: 0,
      maxWidth: '44ch',
      fontSize: 'var(--text-body-s)',
      color: 'var(--text-secondary)',
      lineHeight: 1.6
    }
  }, description) : null, action || secondaryAction ? React.createElement('div', {
    key: 'a',
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      marginTop: 'var(--space-2)'
    }
  }, action, secondaryAction) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function Skeleton({
  width = '100%',
  height = 12,
  radius = 'var(--radius-sm)',
  lines = 1,
  gap = 8,
  circle = false,
  style
}) {
  const one = i => React.createElement('div', {
    key: i,
    style: {
      width: lines > 1 && i === lines - 1 ? '62%' : typeof width === 'number' ? width + 'px' : width,
      height: (circle ? width : height) + (typeof height === 'number' ? 'px' : ''),
      borderRadius: circle ? 'var(--radius-pill)' : radius,
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-subtle)',
      animation: 'tobot-skeleton 1.4s ease-in-out infinite',
      animationDelay: i * 120 + 'ms'
    }
  });
  if (lines <= 1) return React.createElement('div', {
    style: {
      ...style
    }
  }, one(0));
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: gap + 'px',
      ...style
    }
  }, Array.from({
    length: lines
  }, (_, i) => one(i)));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const tstTones = {
  success: {
    bd: 'var(--success-border)',
    fg: 'var(--success)'
  },
  danger: {
    bd: 'var(--danger-border)',
    fg: 'var(--danger)'
  },
  warning: {
    bd: 'var(--warning-border)',
    fg: 'var(--warning)'
  },
  info: {
    bd: 'var(--info-border)',
    fg: 'var(--info)'
  }
};
function Toast({
  tone = 'success',
  title,
  description,
  action,
  onDismiss,
  icon,
  style
}) {
  const t = tstTones[tone] || tstTones.info;
  return React.createElement('div', {
    role: 'status',
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start',
      minWidth: '280px',
      maxWidth: '420px',
      padding: 'var(--space-3) var(--space-4)',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-default)',
      borderLeft: '2px solid ' + t.bd,
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-2)',
      animation: 'tobot-fade-up var(--dur-base) var(--ease-out)',
      ...style
    }
  }, icon ? React.createElement('span', {
    key: 'i',
    style: {
      color: t.fg,
      display: 'flex',
      marginTop: '1px'
    }
  }, icon) : null, React.createElement('div', {
    key: 'c',
    style: {
      flex: 1
    }
  }, React.createElement('div', {
    key: 't',
    style: {
      fontSize: 'var(--text-body-s)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, title), description ? React.createElement('div', {
    key: 'd',
    style: {
      marginTop: '2px',
      fontSize: 'var(--text-caption)',
      color: 'var(--text-secondary)',
      lineHeight: 1.5
    }
  }, description) : null, action ? React.createElement('div', {
    key: 'a',
    style: {
      marginTop: 'var(--space-2)'
    }
  }, action) : null), onDismiss ? React.createElement('button', {
    key: 'x',
    type: 'button',
    'aria-label': 'Dismiss',
    onClick: onDismiss,
    style: {
      all: 'unset',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: '14px',
      lineHeight: 1
    }
  }, '\u00d7') : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  label,
  children,
  side = 'top',
  mono = false,
  style
}) {
  const [open, setOpen] = React.useState(false);
  const pos = {
    top: {
      bottom: 'calc(100% + 6px)',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    bottom: {
      top: 'calc(100% + 6px)',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    left: {
      right: 'calc(100% + 6px)',
      top: '50%',
      transform: 'translateY(-50%)'
    },
    right: {
      left: 'calc(100% + 6px)',
      top: '50%',
      transform: 'translateY(-50%)'
    }
  }[side];
  return React.createElement('span', {
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false)
  }, children, open ? React.createElement('span', {
    key: 't',
    role: 'tooltip',
    style: {
      position: 'absolute',
      ...pos,
      zIndex: 50,
      padding: '5px 8px',
      background: 'var(--coal-800)',
      color: 'var(--coal-50)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-sm)',
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
      fontSize: 'var(--text-caption)',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      boxShadow: 'var(--shadow-2)',
      pointerEvents: 'none',
      animation: 'tobot-fade-up var(--dur-fast) var(--ease-out)'
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/ChannelPicker.jsx
try { (() => {
function ChannelPicker({
  label,
  hint,
  options = [],
  value = [],
  onChange,
  kind = 'channel',
  placeholder = 'Buscar…',
  multiple = true,
  max,
  disabled = false,
  style
}) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const sigil = kind === 'role' ? '@' : kind === 'channel' ? '#' : '';
  React.useEffect(() => {
    if (!open) return;
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  });
  const picked = options.filter(o => value.includes(o.value));
  const list = options.filter(o => !value.includes(o.value) && o.label.toLowerCase().includes(q.toLowerCase()));
  const add = v => {
    if (max && value.length >= max) return;
    onChange && onChange(multiple ? [...value, v] : [v]);
    setQ('');
  };
  const remove = v => onChange && onChange(value.filter(x => x !== v));
  return React.createElement('div', {
    ref,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      position: 'relative',
      ...style
    }
  }, label ? React.createElement('label', {
    key: 'l',
    style: {
      fontSize: 'var(--text-label)',
      fontWeight: 600,
      color: 'var(--text-secondary)'
    }
  }, label) : null, React.createElement('div', {
    key: 'w',
    onClick: () => !disabled && setOpen(true),
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      alignItems: 'center',
      minHeight: '38px',
      padding: '5px 8px',
      background: 'var(--bg-inset)',
      border: '1px solid ' + (open ? 'var(--accent)' : 'var(--border-default)'),
      borderRadius: 'var(--radius-md)',
      cursor: disabled ? 'not-allowed' : 'text',
      opacity: disabled ? .5 : 1,
      boxShadow: open ? '0 0 0 3px var(--bg-tint-accent)' : 'none',
      transition: 'border-color var(--dur-fast) var(--ease-standard)'
    }
  }, picked.map(o => React.createElement('span', {
    key: o.value,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      height: '24px',
      padding: '0 7px',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-label)',
      color: 'var(--text-primary)'
    }
  }, React.createElement('span', {
    key: 's',
    style: {
      color: 'var(--text-muted)'
    }
  }, sigil), o.label, React.createElement('button', {
    key: 'x',
    type: 'button',
    'aria-label': 'Quitar',
    onClick: e => {
      e.stopPropagation();
      remove(o.value);
    },
    style: {
      all: 'unset',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: '12px'
    }
  }, '\u00d7'))), React.createElement('input', {
    key: 'i',
    value: q,
    disabled,
    placeholder: picked.length ? '' : placeholder,
    onChange: e => {
      setQ(e.target.value);
      setOpen(true);
    },
    onFocus: () => setOpen(true),
    style: {
      all: 'unset',
      flex: 1,
      minWidth: '70px',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-label)',
      color: 'var(--text-primary)'
    }
  })), open && list.length ? React.createElement('div', {
    key: 'd',
    role: 'listbox',
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 60,
      marginTop: '4px',
      maxHeight: '168px',
      overflowY: 'auto',
      padding: '4px',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-2)',
      animation: 'tobot-fade-up var(--dur-fast) var(--ease-out)'
    }
  }, list.map(o => React.createElement(PickerOption, {
    key: o.value,
    option: o,
    sigil,
    onPick: () => add(o.value)
  }))) : null, hint ? React.createElement('span', {
    key: 'h',
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
function PickerOption({
  option,
  sigil,
  onPick
}) {
  const [hover, setHover] = React.useState(false);
  return React.createElement('button', {
    type: 'button',
    role: 'option',
    onClick: onPick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: '100%',
      padding: '6px 8px',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-label)',
      color: hover ? 'var(--text-primary)' : 'var(--text-secondary)',
      background: hover ? 'var(--bg-hover)' : 'transparent'
    }
  }, React.createElement('span', {
    key: 's',
    style: {
      color: 'var(--text-muted)'
    }
  }, sigil), React.createElement('span', {
    key: 'l',
    style: {
      flex: 1
    }
  }, option.label), option.meta ? React.createElement('span', {
    key: 'm',
    style: {
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, option.meta) : null);
}
Object.assign(__ds_scope, { ChannelPicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/ChannelPicker.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked = false,
  onChange,
  label,
  hint,
  disabled = false,
  indeterminate = false,
  style,
  ...rest
}) {
  const box = {
    width: '16px',
    height: '16px',
    flexShrink: 0,
    borderRadius: 'var(--radius-xs)',
    border: '1px solid ' + (checked || indeterminate ? 'var(--accent)' : 'var(--border-strong)'),
    background: checked || indeterminate ? 'var(--accent)' : 'var(--bg-inset)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--on-accent)',
    fontSize: '11px',
    fontWeight: 700,
    lineHeight: 1,
    transition: 'background var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)'
  };
  return React.createElement('label', {
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .5 : 1,
      ...style
    }
  }, React.createElement('input', {
    key: 'i',
    type: 'checkbox',
    checked,
    onChange,
    disabled,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    },
    ...rest
  }), React.createElement('span', {
    key: 'b',
    style: box,
    'aria-hidden': true
  }, indeterminate ? '\u2013' : checked ? '\u2713' : ''), label ? React.createElement('span', {
    key: 'l',
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }
  }, React.createElement('span', {
    key: 't',
    style: {
      fontSize: 'var(--text-body-s)',
      color: 'var(--text-primary)'
    }
  }, label), hint ? React.createElement('span', {
    key: 'h',
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null) : null);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  value,
  defaultValue,
  onChange,
  placeholder,
  label,
  hint,
  error,
  prefix,
  suffix,
  size = 'md',
  mono = false,
  disabled = false,
  multiline = false,
  rows = 3,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const heights = {
    sm: '30px',
    md: '38px',
    lg: '44px'
  };
  const wrap = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    background: 'var(--bg-inset)',
    border: '1px solid ' + (error ? 'var(--danger-border)' : focus ? 'var(--accent)' : 'var(--border-default)'),
    borderRadius: 'var(--radius-md)',
    padding: '0 10px',
    height: multiline ? 'auto' : heights[size],
    opacity: disabled ? .5 : 1,
    transition: 'border-color var(--dur-fast) var(--ease-standard),box-shadow var(--dur-fast) var(--ease-standard)',
    boxShadow: focus && !error ? '0 0 0 3px var(--bg-tint-accent)' : 'none'
  };
  const field = {
    all: 'unset',
    flex: 1,
    minWidth: 0,
    color: 'var(--text-primary)',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
    fontSize: size === 'sm' ? 'var(--text-label)' : 'var(--text-body-s)',
    lineHeight: 1.5,
    padding: multiline ? '8px 0' : '0',
    resize: 'vertical'
  };
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...style
    }
  }, label ? React.createElement('label', {
    key: 'l',
    htmlFor: id,
    style: {
      fontSize: 'var(--text-label)',
      fontWeight: 600,
      color: 'var(--text-secondary)',
      letterSpacing: 'var(--ls-label)'
    }
  }, label) : null, React.createElement('div', {
    key: 'w',
    style: wrap
  }, prefix ? React.createElement('span', {
    key: 'p',
    style: {
      color: 'var(--text-muted)',
      display: 'flex',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)'
    }
  }, prefix) : null, React.createElement(multiline ? 'textarea' : 'input', {
    key: 'f',
    id,
    value,
    defaultValue,
    onChange,
    placeholder,
    disabled,
    rows: multiline ? rows : undefined,
    style: field,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    ...rest
  }), suffix ? React.createElement('span', {
    key: 's',
    style: {
      color: 'var(--text-muted)',
      display: 'flex',
      fontSize: 'var(--text-caption)'
    }
  }, suffix) : null), error || hint ? React.createElement('span', {
    key: 'h',
    style: {
      fontSize: 'var(--text-caption)',
      color: error ? 'var(--danger)' : 'var(--text-muted)'
    }
  }, error || hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  options = [],
  value,
  onChange,
  name,
  label,
  direction = 'column',
  disabled = false,
  style
}) {
  return React.createElement('div', {
    role: 'radiogroup',
    'aria-label': typeof label === 'string' ? label : undefined,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      ...style
    }
  }, label ? React.createElement('span', {
    key: 'l',
    style: {
      fontSize: 'var(--text-label)',
      fontWeight: 600,
      color: 'var(--text-secondary)'
    }
  }, label) : null, React.createElement('div', {
    key: 'o',
    style: {
      display: 'flex',
      flexDirection: direction,
      gap: direction === 'row' ? 'var(--space-5)' : 'var(--space-3)'
    }
  }, options.map(o => {
    const on = value === o.value;
    return React.createElement('label', {
      key: o.value,
      style: {
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'flex-start',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? .5 : 1
      }
    }, React.createElement('input', {
      key: 'i',
      type: 'radio',
      name,
      checked: on,
      disabled,
      onChange: () => onChange && onChange(o.value),
      style: {
        position: 'absolute',
        opacity: 0,
        width: 0,
        height: 0
      }
    }), React.createElement('span', {
      key: 'd',
      style: {
        width: '16px',
        height: '16px',
        flexShrink: 0,
        borderRadius: 'var(--radius-pill)',
        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border-strong)'),
        background: 'var(--bg-inset)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color var(--dur-fast) var(--ease-standard)'
      },
      'aria-hidden': true
    }, on ? React.createElement('span', {
      style: {
        width: '8px',
        height: '8px',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--accent)'
      }
    }) : null), React.createElement('span', {
      key: 't',
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }
    }, React.createElement('span', {
      key: 'a',
      style: {
        fontSize: 'var(--text-body-s)',
        color: 'var(--text-primary)'
      }
    }, o.label), o.hint ? React.createElement('span', {
      key: 'b',
      style: {
        fontSize: 'var(--text-caption)',
        color: 'var(--text-muted)'
      }
    }, o.hint) : null));
  })));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  value,
  onChange,
  options = [],
  label,
  hint,
  placeholder = 'Select…',
  size = 'md',
  disabled = false,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const heights = {
    sm: '30px',
    md: '38px',
    lg: '44px'
  };
  const s = {
    appearance: 'none',
    width: '100%',
    height: heights[size],
    padding: '0 30px 0 10px',
    background: 'var(--bg-inset)',
    color: value ? 'var(--text-primary)' : 'var(--text-muted)',
    border: '1px solid ' + (focus ? 'var(--accent)' : 'var(--border-default)'),
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontSize: size === 'sm' ? 'var(--text-label)' : 'var(--text-body-s)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? .5 : 1,
    outline: 'none',
    transition: 'border-color var(--dur-fast) var(--ease-standard)'
  };
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...style
    }
  }, label ? React.createElement('label', {
    key: 'l',
    htmlFor: id,
    style: {
      fontSize: 'var(--text-label)',
      fontWeight: 600,
      color: 'var(--text-secondary)'
    }
  }, label) : null, React.createElement('div', {
    key: 'w',
    style: {
      position: 'relative'
    }
  }, React.createElement('select', {
    key: 's',
    id,
    value,
    onChange,
    disabled,
    style: s,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    ...rest
  }, React.createElement('option', {
    key: 'ph',
    value: '',
    disabled: true
  }, placeholder), options.map(o => React.createElement('option', {
    key: o.value,
    value: o.value
  }, o.label))), React.createElement('span', {
    key: 'c',
    style: {
      position: 'absolute',
      right: '10px',
      top: 0,
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      color: 'var(--text-muted)',
      pointerEvents: 'none',
      fontSize: '10px'
    }
  }, '\u25be')), hint ? React.createElement('span', {
    key: 'h',
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Slider.jsx
try { (() => {
function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  label,
  valueLabel,
  unit,
  onChange,
  disabled = false,
  ticks,
  style
}) {
  const pct = (value - min) / (max - min) * 100;
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      ...style
    }
  }, label || valueLabel !== undefined ? React.createElement('div', {
    key: 'l',
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, React.createElement('span', {
    key: 'a',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      fontWeight: 700
    }
  }, label), React.createElement('span', {
    key: 'b',
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 'var(--text-h3)',
      color: 'var(--text-primary)'
    }
  }, valueLabel !== undefined ? valueLabel : value, unit ? React.createElement('span', {
    style: {
      fontSize: '11px',
      color: 'var(--text-muted)',
      marginLeft: '4px'
    }
  }, unit) : null)) : null, React.createElement('input', {
    key: 'i',
    type: 'range',
    min,
    max,
    step,
    value,
    disabled,
    onChange: e => onChange && onChange(Number(e.target.value)),
    style: {
      width: '100%',
      accentColor: 'var(--accent)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .5 : 1,
      background: 'linear-gradient(to right,var(--accent) ' + pct + '%,var(--bg-inset) ' + pct + '%)',
      height: '4px',
      borderRadius: 'var(--radius-pill)'
    }
  }), ticks ? React.createElement('div', {
    key: 't',
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, ticks.map((t, i) => React.createElement('span', {
    key: i
  }, t))) : null);
}
Object.assign(__ds_scope, { Slider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Slider.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked = false,
  onChange,
  label,
  hint,
  size = 'md',
  disabled = false,
  style,
  ...rest
}) {
  const w = size === 'sm' ? 32 : 40,
    h = size === 'sm' ? 18 : 22,
    k = h - 6;
  const track = {
    width: w + 'px',
    height: h + 'px',
    flexShrink: 0,
    borderRadius: 'var(--radius-pill)',
    background: checked ? 'var(--accent)' : 'var(--bg-inset)',
    border: '1px solid ' + (checked ? 'var(--accent)' : 'var(--border-strong)'),
    position: 'relative',
    transition: 'background var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)'
  };
  const knob = {
    position: 'absolute',
    top: '2px',
    left: checked ? w - k - 4 + 'px' : '2px',
    width: k + 'px',
    height: k + 'px',
    borderRadius: 'var(--radius-pill)',
    background: checked ? 'var(--on-accent)' : 'var(--coal-400)',
    transition: 'left var(--dur-fast) var(--ease-snap),background var(--dur-fast) var(--ease-standard)'
  };
  return React.createElement('label', {
    style: {
      display: 'inline-flex',
      gap: 'var(--space-3)',
      alignItems: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .5 : 1,
      ...style
    }
  }, React.createElement('input', {
    key: 'i',
    type: 'checkbox',
    role: 'switch',
    checked,
    disabled,
    onChange,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    },
    ...rest
  }), React.createElement('span', {
    key: 't',
    style: track,
    'aria-hidden': true
  }, React.createElement('span', {
    style: knob
  })), label ? React.createElement('span', {
    key: 'l',
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, React.createElement('span', {
    key: 'a',
    style: {
      fontSize: 'var(--text-body-s)',
      fontWeight: 500,
      color: 'var(--text-primary)'
    }
  }, label), hint ? React.createElement('span', {
    key: 'b',
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/TimezoneSelect.jsx
try { (() => {
const TZ = [{
  value: 'Europe/Madrid',
  label: 'Europe/Madrid',
  offset: 'UTC+2'
}, {
  value: 'Europe/London',
  label: 'Europe/London',
  offset: 'UTC+1'
}, {
  value: 'America/Mexico_City',
  label: 'America/Mexico_City',
  offset: 'UTC-6'
}, {
  value: 'America/Bogota',
  label: 'America/Bogota',
  offset: 'UTC-5'
}, {
  value: 'America/Argentina/Buenos_Aires',
  label: 'America/Buenos_Aires',
  offset: 'UTC-3'
}, {
  value: 'America/New_York',
  label: 'America/New_York',
  offset: 'UTC-4'
}, {
  value: 'America/Los_Angeles',
  label: 'America/Los_Angeles',
  offset: 'UTC-7'
}, {
  value: 'Asia/Tokyo',
  label: 'Asia/Tokyo',
  offset: 'UTC+9'
}];
function TimezoneSelect({
  value,
  onChange,
  label = 'Zona horaria',
  hint,
  zones = TZ,
  preview,
  disabled = false,
  style
}) {
  const z = zones.find(t => t.value === value);
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...style
    }
  }, label ? React.createElement('label', {
    key: 'l',
    style: {
      fontSize: 'var(--text-label)',
      fontWeight: 600,
      color: 'var(--text-secondary)'
    }
  }, label) : null, React.createElement('div', {
    key: 'w',
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      alignItems: 'stretch'
    }
  }, React.createElement('select', {
    key: 's',
    value: value || '',
    disabled,
    onChange: e => onChange && onChange(e.target.value),
    style: {
      appearance: 'none',
      flex: 1,
      height: '38px',
      padding: '0 30px 0 10px',
      background: 'var(--bg-inset)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-label)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      outline: 'none'
    }
  }, zones.map(t => React.createElement('option', {
    key: t.value,
    value: t.value
  }, t.label + '  ' + t.offset))), React.createElement('span', {
    key: 'o',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0 10px',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-label)',
      color: 'var(--text-accent)'
    }
  }, z ? z.offset : '—')), preview ? React.createElement('span', {
    key: 'p',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, preview) : null, hint ? React.createElement('span', {
    key: 'h',
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { TimezoneSelect });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TimezoneSelect.jsx", error: String((e && e.message) || e) }); }

// components/marketing/PricingTier.jsx
try { (() => {
function PricingTier({
  name,
  price,
  period = '/mo',
  tagline,
  features = [],
  cta,
  featured = false,
  badge,
  note,
  style
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
      padding: 'var(--space-6)',
      borderRadius: 'var(--radius-lg)',
      background: featured ? 'var(--bg-tint-accent)' : 'var(--bg-surface)',
      border: '1px solid ' + (featured ? 'var(--accent)' : 'var(--border-subtle)'),
      ...style
    }
  }, React.createElement('div', {
    key: 'h'
  }, React.createElement('div', {
    key: 'n',
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, React.createElement('span', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: featured ? 'var(--text-accent)' : 'var(--text-muted)'
    }
  }, name), badge), React.createElement('div', {
    key: 'p',
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '4px',
      marginTop: 'var(--space-3)'
    }
  }, React.createElement('span', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: '40px',
      lineHeight: 1,
      color: 'var(--text-primary)'
    }
  }, price), React.createElement('span', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      color: 'var(--text-muted)'
    }
  }, period)), tagline ? React.createElement('p', {
    key: 't',
    style: {
      margin: 'var(--space-3) 0 0',
      fontSize: 'var(--text-body-s)',
      color: 'var(--text-secondary)',
      lineHeight: 1.55
    }
  }, tagline) : null), React.createElement('div', {
    key: 'f',
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: 'var(--space-4)'
    }
  }, features.map((ft, i) => {
    const off = typeof ft === 'object' && ft.included === false;
    const label = typeof ft === 'object' ? ft.label : ft;
    return React.createElement('div', {
      key: i,
      style: {
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'flex-start',
        fontSize: 'var(--text-body-s)',
        color: off ? 'var(--text-muted)' : 'var(--text-secondary)'
      }
    }, React.createElement('span', {
      key: 'm',
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        lineHeight: 1.6,
        color: off ? 'var(--text-muted)' : 'var(--accent)'
      }
    }, off ? '\u2014' : '\u2713'), React.createElement('span', {
      key: 'l'
    }, label));
  })), React.createElement('div', {
    key: 'c',
    style: {
      marginTop: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, cta, note ? React.createElement('span', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)',
      textAlign: 'center'
    }
  }, note) : null));
}
Object.assign(__ds_scope, { PricingTier });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/PricingTier.jsx", error: String((e && e.message) || e) }); }

// components/marketing/Ticker.jsx
try { (() => {
function Ticker({
  items = [],
  separator = '\u2726',
  speed = 26,
  tone = 'accent',
  height = 30,
  style
}) {
  const text = items.length ? items.join('  ' + separator + '  ') + '  ' + separator + '  ' : '';
  const run = text.repeat(3);
  const tones = {
    accent: {
      background: 'var(--accent)',
      color: 'var(--on-accent)'
    },
    inverse: {
      background: 'var(--bg-inset)',
      color: 'var(--text-accent)'
    },
    quiet: {
      background: 'var(--bg-surface)',
      color: 'var(--text-muted)'
    }
  };
  return React.createElement('div', {
    style: {
      height: height + 'px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      borderTop: '1px solid var(--border-subtle)',
      borderBottom: '1px solid var(--border-subtle)',
      ...tones[tone],
      ...style
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      gap: '36px',
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      animation: 'tobot-ticker ' + speed + 's linear infinite'
    }
  }, React.createElement('span', {
    key: 'a'
  }, run), React.createElement('span', {
    key: 'b'
  }, run)));
}
Object.assign(__ds_scope, { Ticker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/Ticker.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Accordion.jsx
try { (() => {
function Accordion({
  items = [],
  defaultOpen = 0,
  allowMultiple = false,
  style
}) {
  const [open, setOpen] = React.useState(allowMultiple ? defaultOpen >= 0 ? [defaultOpen] : [] : defaultOpen);
  const isOpen = i => allowMultiple ? open.includes(i) : open === i;
  const toggle = i => allowMultiple ? setOpen(o => o.includes(i) ? o.filter(x => x !== i) : [...o, i]) : setOpen(o => o === i ? -1 : i);
  return React.createElement('div', {
    style: {
      borderTop: '1px solid var(--border-subtle)',
      ...style
    }
  }, items.map((it, i) => React.createElement('div', {
    key: i,
    style: {
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, React.createElement('button', {
    type: 'button',
    'aria-expanded': isOpen(i),
    onClick: () => toggle(i),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      padding: 'var(--space-4) 0'
    }
  }, React.createElement('span', {
    key: 'q',
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-h4)',
      color: 'var(--text-primary)'
    }
  }, it.title), React.createElement('span', {
    key: 'i',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '14px',
      color: isOpen(i) ? 'var(--accent)' : 'var(--text-muted)',
      transition: 'color var(--dur-fast) var(--ease-standard)'
    }
  }, isOpen(i) ? '\u2212' : '+')), isOpen(i) ? React.createElement('div', {
    key: 'a',
    style: {
      paddingBottom: 'var(--space-4)',
      maxWidth: '62ch',
      fontSize: 'var(--text-body-s)',
      color: 'var(--text-secondary)',
      lineHeight: 1.6,
      animation: 'tobot-fade-up var(--dur-fast) var(--ease-out)'
    }
  }, it.content) : null)));
}
Object.assign(__ds_scope, { Accordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Accordion.jsx", error: String((e && e.message) || e) }); }

// components/navigation/CommandPalette.jsx
try { (() => {
function CommandPalette({
  open = true,
  commands = [],
  placeholder = 'Escribe un comando o busca un módulo…',
  onClose,
  onRun,
  hint = '⌘K',
  style
}) {
  const [q, setQ] = React.useState('');
  const [i, setI] = React.useState(0);
  const list = commands.filter(c => (c.label + ' ' + (c.group || '')).toLowerCase().includes(q.toLowerCase()));
  React.useEffect(() => {
    setI(0);
  }, [q]);
  if (!open) return null;
  const key = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setI(v => Math.min(v + 1, list.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setI(v => Math.max(v - 1, 0));
    }
    if (e.key === 'Enter' && list[i]) {
      onRun && onRun(list[i]);
      onClose && onClose();
    }
    if (e.key === 'Escape') {
      onClose && onClose();
    }
  };
  return React.createElement('div', {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 80,
      background: 'rgba(5,7,5,.75)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '12vh'
    }
  }, React.createElement('div', {
    onClick: e => e.stopPropagation(),
    role: 'dialog',
    style: {
      width: '540px',
      maxWidth: '92vw',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-3)',
      overflow: 'hidden',
      animation: 'tobot-fade-up var(--dur-base) var(--ease-out)',
      ...style
    }
  }, React.createElement('div', {
    key: 'i',
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-4)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, React.createElement('span', {
    key: 's',
    style: {
      fontFamily: 'var(--font-mono)',
      color: 'var(--accent)',
      fontSize: '13px'
    }
  }, '>'), React.createElement('input', {
    key: 'f',
    autoFocus: true,
    value: q,
    placeholder,
    onChange: e => setQ(e.target.value),
    onKeyDown: key,
    style: {
      all: 'unset',
      flex: 1,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-body-s)',
      color: 'var(--text-primary)'
    }
  }), React.createElement('span', {
    key: 'k',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xs)',
      padding: '2px 5px'
    }
  }, hint)), React.createElement('div', {
    key: 'l',
    style: {
      maxHeight: '320px',
      overflowY: 'auto',
      padding: '6px'
    }
  }, list.length ? list.map((c, idx) => React.createElement('div', {
    key: idx,
    onMouseEnter: () => setI(idx),
    onClick: () => {
      onRun && onRun(c);
      onClose && onClose();
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: '8px 10px',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      background: idx === i ? 'var(--bg-tint-accent)' : 'transparent',
      color: idx === i ? 'var(--text-primary)' : 'var(--text-secondary)'
    }
  }, c.icon ? React.createElement('span', {
    key: 'ic',
    style: {
      display: 'flex',
      color: idx === i ? 'var(--text-accent)' : 'var(--text-muted)'
    }
  }, c.icon) : null, React.createElement('span', {
    key: 'lb',
    style: {
      flex: 1,
      fontSize: 'var(--text-body-s)'
    }
  }, c.label), c.group ? React.createElement('span', {
    key: 'g',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, c.group) : null, c.shortcut ? React.createElement('span', {
    key: 'sc',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, c.shortcut) : null)) : React.createElement('div', {
    style: {
      padding: 'var(--space-6)',
      textAlign: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      color: 'var(--text-muted)'
    }
  }, 'sin resultados para "' + q + '"')), React.createElement('div', {
    key: 'f2',
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      padding: '8px var(--space-4)',
      borderTop: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, React.createElement('span', {
    key: 'a'
  }, '↑↓ navegar'), React.createElement('span', {
    key: 'b'
  }, '↵ ejecutar'), React.createElement('span', {
    key: 'c'
  }, 'esc cerrar'))));
}
Object.assign(__ds_scope, { CommandPalette });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/CommandPalette.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Menu.jsx
try { (() => {
function Menu({
  trigger,
  items = [],
  align = 'left',
  width = 200,
  open: openProp,
  onOpenChange,
  style
}) {
  const [openState, setOpen] = React.useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const set = v => {
    onOpenChange ? onOpenChange(v) : setOpen(v);
  };
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) set(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  });
  return React.createElement('div', {
    ref,
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    }
  }, React.createElement('span', {
    key: 't',
    onClick: () => set(!open),
    style: {
      display: 'inline-flex'
    }
  }, trigger), open ? React.createElement('div', {
    key: 'm',
    role: 'menu',
    style: {
      position: 'absolute',
      top: 'calc(100% + 6px)',
      [align === 'right' ? 'right' : 'left']: 0,
      zIndex: 60,
      width: width + 'px',
      padding: '4px',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-2)',
      animation: 'tobot-fade-up var(--dur-fast) var(--ease-out)'
    }
  }, items.map((it, i) => it.separator ? React.createElement('div', {
    key: i,
    style: {
      height: '1px',
      background: 'var(--border-subtle)',
      margin: '4px 0'
    }
  }) : React.createElement(MenuItem, {
    key: i,
    item: it,
    onPick: () => {
      set(false);
      it.onSelect && it.onSelect();
    }
  }))) : null);
}
function MenuItem({
  item,
  onPick
}) {
  const [hover, setHover] = React.useState(false);
  const danger = item.tone === 'danger';
  return React.createElement('button', {
    type: 'button',
    role: 'menuitem',
    disabled: item.disabled,
    onClick: onPick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      width: '100%',
      padding: '7px 9px',
      borderRadius: 'var(--radius-sm)',
      cursor: item.disabled ? 'not-allowed' : 'pointer',
      opacity: item.disabled ? .4 : 1,
      fontSize: 'var(--text-body-s)',
      color: danger ? 'var(--danger)' : 'var(--text-secondary)',
      background: hover && !item.disabled ? danger ? 'var(--danger-bg)' : 'var(--bg-hover)' : 'transparent'
    }
  }, item.icon ? React.createElement('span', {
    key: 'i',
    style: {
      display: 'flex',
      color: 'inherit'
    }
  }, item.icon) : null, React.createElement('span', {
    key: 'l',
    style: {
      flex: 1
    }
  }, item.label), item.shortcut ? React.createElement('span', {
    key: 's',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, item.shortcut) : null);
}
Object.assign(__ds_scope, { Menu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Menu.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavItem.jsx
try { (() => {
function NavItem({
  icon,
  label,
  active = false,
  badge,
  collapsed = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    width: '100%',
    height: '34px',
    padding: collapsed ? '0' : '0 10px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    background: active ? 'var(--bg-tint-accent)' : hover ? 'var(--bg-hover)' : 'transparent',
    border: '1px solid transparent',
    borderLeft: '2px solid ' + (active ? 'var(--accent)' : 'transparent'),
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body-s)',
    fontWeight: active ? 600 : 500,
    transition: 'background var(--dur-fast) var(--ease-standard),color var(--dur-fast) var(--ease-standard)',
    ...style
  };
  return React.createElement('button', {
    type: 'button',
    onClick,
    style: s,
    'aria-current': active || undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    ...rest
  }, icon ? React.createElement('span', {
    key: 'i',
    style: {
      display: 'flex',
      color: active ? 'var(--text-accent)' : 'var(--text-muted)',
      flexShrink: 0
    }
  }, icon) : null, collapsed ? null : React.createElement('span', {
    key: 'l',
    style: {
      flex: 1,
      textAlign: 'left'
    }
  }, label), !collapsed && badge ? React.createElement('span', {
    key: 'b',
    style: {
      flexShrink: 0
    }
  }, badge) : null);
}
Object.assign(__ds_scope, { NavItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavItem.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Stepper.jsx
try { (() => {
function Stepper({
  steps = [],
  current = 0,
  orientation = 'horizontal',
  onStepClick,
  style
}) {
  const row = orientation === 'horizontal';
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: row ? 'row' : 'column',
      alignItems: row ? 'center' : 'stretch',
      gap: row ? 'var(--space-3)' : 'var(--space-2)',
      ...style
    }
  }, steps.map((s, i) => {
    const done = i < current,
      now = i === current;
    const mark = {
      width: '22px',
      height: '22px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      fontWeight: 700,
      background: now ? 'var(--accent)' : done ? 'var(--bg-tint-accent)' : 'var(--bg-inset)',
      color: now ? 'var(--on-accent)' : done ? 'var(--text-accent)' : 'var(--text-muted)',
      border: '1px solid ' + (now || done ? 'var(--accent)' : 'var(--border-default)')
    };
    return React.createElement(React.Fragment, {
      key: i
    }, React.createElement('button', {
      type: 'button',
      onClick: onStepClick ? () => onStepClick(i) : undefined,
      style: {
        all: 'unset',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        cursor: onStepClick ? 'pointer' : 'default'
      }
    }, React.createElement('span', {
      key: 'm',
      style: mark
    }, done ? '\u2713' : String(i + 1)), React.createElement('span', {
      key: 'l',
      style: {
        fontSize: 'var(--text-body-s)',
        fontWeight: now ? 600 : 400,
        color: now ? 'var(--text-primary)' : done ? 'var(--text-secondary)' : 'var(--text-muted)'
      }
    }, typeof s === 'string' ? s : s.label)), i < steps.length - 1 ? React.createElement('span', {
      key: 'r',
      style: row ? {
        flex: 1,
        height: '1px',
        background: i < current ? 'var(--accent)' : 'var(--border-default)',
        minWidth: '16px'
      } : {
        width: '1px',
        height: '14px',
        marginLeft: '11px',
        background: i < current ? 'var(--accent)' : 'var(--border-default)'
      }
    }) : null);
  }));
}
Object.assign(__ds_scope, { Stepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Stepper.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  tabs = [],
  value,
  onChange,
  variant = 'underline',
  size = 'md',
  style
}) {
  const under = variant === 'underline';
  const wrap = {
    display: 'flex',
    gap: under ? 'var(--space-5)' : 'var(--space-1)',
    borderBottom: under ? '1px solid var(--border-subtle)' : 'none',
    background: under ? 'transparent' : 'var(--bg-inset)',
    padding: under ? 0 : '3px',
    borderRadius: under ? 0 : 'var(--radius-md)',
    border: under ? undefined : '1px solid var(--border-subtle)',
    ...style
  };
  return React.createElement('div', {
    role: 'tablist',
    style: wrap
  }, tabs.map(t => {
    const on = value === t.value;
    const s = under ? {
      padding: '0 0 10px',
      background: 'none',
      border: 'none',
      borderBottom: '2px solid ' + (on ? 'var(--accent)' : 'transparent'),
      marginBottom: '-1px',
      color: on ? 'var(--text-primary)' : 'var(--text-muted)'
    } : {
      padding: '0 12px',
      height: size === 'sm' ? '26px' : '30px',
      border: '1px solid ' + (on ? 'var(--border-default)' : 'transparent'),
      background: on ? 'var(--bg-raised)' : 'transparent',
      borderRadius: 'var(--radius-sm)',
      color: on ? 'var(--text-primary)' : 'var(--text-muted)'
    };
    return React.createElement('button', {
      key: t.value,
      type: 'button',
      role: 'tab',
      'aria-selected': on,
      onClick: () => onChange && onChange(t.value),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: size === 'sm' ? 'var(--text-label)' : 'var(--text-body-s)',
        fontWeight: 600,
        transition: 'color var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)',
        ...s
      }
    }, t.icon, t.label, t.count != null ? React.createElement('span', {
      key: 'c',
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-overline)',
        color: 'var(--text-muted)'
      }
    }, t.count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/product/EmbedPreview.jsx
try { (() => {
function EmbedPreview({
  author,
  title,
  description,
  fields = [],
  footer,
  timestamp,
  color = 'var(--accent)',
  thumbnail,
  image,
  botName = 'Tobot',
  botTag = 'APP',
  style
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      padding: 'var(--space-4)',
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, React.createElement('span', {
    key: 'av',
    style: {
      width: '34px',
      height: '34px',
      flexShrink: 0,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--accent)',
      color: 'var(--on-accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '16px'
    }
  }, 't'), React.createElement('div', {
    key: 'c',
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement('div', {
    key: 'h',
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }
  }, React.createElement('span', {
    style: {
      fontWeight: 600,
      fontSize: 'var(--text-body-s)',
      color: 'var(--text-primary)'
    }
  }, botName), React.createElement('span', {
    style: {
      padding: '1px 5px',
      borderRadius: 'var(--radius-xs)',
      background: 'var(--accent)',
      color: 'var(--on-accent)',
      fontFamily: 'var(--font-mono)',
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '.08em'
    }
  }, botTag), timestamp ? React.createElement('span', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, timestamp) : null), React.createElement('div', {
    key: 'e',
    style: {
      marginTop: '6px',
      display: 'flex',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden'
    }
  }, React.createElement('span', {
    key: 'bar',
    style: {
      width: '4px',
      flexShrink: 0,
      background: color
    }
  }), React.createElement('div', {
    key: 'body',
    style: {
      flex: 1,
      minWidth: 0,
      padding: 'var(--space-3) var(--space-4)'
    }
  }, author ? React.createElement('div', {
    key: 'a',
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--text-secondary)',
      marginBottom: '4px'
    }
  }, author) : null, title ? React.createElement('div', {
    key: 't',
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-h4)',
      color: 'var(--text-accent)'
    }
  }, title) : null, description ? React.createElement('div', {
    key: 'd',
    style: {
      marginTop: '4px',
      fontSize: 'var(--text-body-s)',
      color: 'var(--text-secondary)',
      lineHeight: 1.55
    }
  }, description) : null, fields.length ? React.createElement('div', {
    key: 'f',
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
      gap: 'var(--space-3)',
      marginTop: 'var(--space-3)'
    }
  }, fields.map((fl, i) => React.createElement('div', {
    key: i
  }, React.createElement('div', {
    style: {
      fontSize: 'var(--text-caption)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, fl.name), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      color: 'var(--text-secondary)'
    }
  }, fl.value)))) : null, image ? React.createElement('div', {
    key: 'im',
    style: {
      marginTop: 'var(--space-3)',
      height: '88px',
      borderRadius: 'var(--radius-xs)',
      background: 'var(--bg-inset)',
      border: '1px dashed var(--border-default)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, image) : null, footer ? React.createElement('div', {
    key: 'ft',
    style: {
      marginTop: 'var(--space-3)',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, footer) : null), thumbnail ? React.createElement('div', {
    key: 'th',
    style: {
      width: '56px',
      height: '56px',
      margin: 'var(--space-3)',
      flexShrink: 0,
      borderRadius: 'var(--radius-xs)',
      background: 'var(--bg-inset)',
      border: '1px dashed var(--border-default)'
    }
  }) : null)));
}
Object.assign(__ds_scope, { EmbedPreview });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/product/EmbedPreview.jsx", error: String((e && e.message) || e) }); }

// components/product/ModuleCard.jsx
try { (() => {
function ModuleCard({
  name,
  description,
  icon,
  enabled = false,
  tier = 'free',
  stat,
  onToggle,
  onOpen,
  locked = false,
  celebrate = false,
  layout = 'card',
  index,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const shadow = enabled ? 'var(--acid-800)' : 'var(--border-subtle)';
  const handlers = {
    onClick: onOpen,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false)
  };
  const badge = tier === 'pro' ? React.createElement('span', {
    key: 'b',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: '17px',
      padding: '0 6px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--accent)',
      color: 'var(--on-accent)',
      fontFamily: 'var(--font-mono)',
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '.12em',
      textTransform: 'uppercase'
    }
  }, 'Pro') : null;
  if (layout === 'row') {
    const rowStyle = {
      display: 'grid',
      gridTemplateColumns: '26px 30px minmax(0,1fr) minmax(0,1.1fr) 190px 42px',
      gap: 'var(--space-4)',
      alignItems: 'center',
      padding: '11px var(--space-4)',
      borderBottom: '1px solid var(--border-subtle)',
      background: hover && onOpen ? 'var(--bg-hover)' : enabled ? 'transparent' : 'rgba(0,0,0,.18)',
      cursor: onOpen ? 'pointer' : 'default',
      opacity: locked ? .75 : 1,
      transition: 'background var(--dur-fast) var(--ease-standard)',
      ...style
    };
    return React.createElement('div', {
      style: rowStyle,
      onClick: onOpen,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false)
    }, React.createElement('span', {
      key: 'n',
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: enabled ? 'var(--accent)' : 'var(--text-muted)'
      }
    }, index != null ? String(index).padStart(2, '0') : ''), React.createElement('span', {
      key: 'i',
      style: {
        display: 'flex',
        color: enabled ? 'var(--text-accent)' : 'var(--text-muted)'
      }
    }, icon), React.createElement('span', {
      key: 't',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        minWidth: 0
      }
    }, React.createElement('b', {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: '15px',
        fontWeight: 700,
        color: enabled ? 'var(--text-primary)' : 'var(--text-muted)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, name), badge), React.createElement('span', {
      key: 'd',
      style: {
        fontSize: 'var(--text-caption)',
        color: 'var(--text-muted)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, description), React.createElement('span', {
      key: 's',
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-mono-s)',
        color: enabled ? 'var(--text-secondary)' : 'var(--text-muted)'
      }
    }, stat), React.createElement('span', {
      key: 'w',
      onClick: e => e.stopPropagation(),
      style: {
        display: 'flex',
        justifyContent: 'flex-end'
      }
    }, onToggle));
  }
  const cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    padding: 'var(--space-4)',
    background: 'var(--bg-surface)',
    border: '1px solid ' + (enabled ? 'var(--accent)' : 'var(--border-default)'),
    borderRadius: 'var(--radius-lg)',
    cursor: onOpen ? 'pointer' : 'default',
    opacity: locked ? .75 : 1,
    boxShadow: '4px 4px 0 ' + shadow,
    transition: 'transform 90ms cubic-bezier(.2,.9,.1,1),box-shadow 90ms cubic-bezier(.2,.9,.1,1),border-color var(--dur-fast) var(--ease-standard)',
    ...(hover && onOpen ? {
      transform: 'translate(2px,2px)',
      boxShadow: '2px 2px 0 ' + shadow
    } : null),
    ...(down && onOpen ? {
      transform: 'translate(4px,4px)',
      boxShadow: '0 0 0 ' + shadow
    } : null),
    ...style
  };
  return React.createElement('div', {
    style: cardStyle,
    ...handlers
  }, React.createElement('div', {
    key: 'r',
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)'
    }
  }, React.createElement('span', {
    key: 'i',
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '34px',
      height: '34px',
      flexShrink: 0,
      borderRadius: 'var(--radius-sm)',
      background: enabled ? 'var(--accent)' : 'var(--bg-inset)',
      border: '1px solid ' + (enabled ? 'var(--accent)' : 'var(--border-subtle)'),
      color: enabled ? 'var(--on-accent)' : 'var(--text-muted)'
    }
  }, celebrate ? React.createElement('span', {
    key: 's',
    'aria-hidden': 'true',
    style: {
      position: 'absolute',
      top: '-9px',
      right: '-7px',
      fontFamily: 'var(--font-mono)',
      fontSize: '13px',
      color: 'var(--accent)',
      animation: 'tobot-spark var(--dur-celebrate) var(--ease-spring) forwards'
    }
  }, '\u2726') : null, icon), React.createElement('div', {
    key: 't',
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement('div', {
    key: 'n',
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, React.createElement('span', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '16px',
      letterSpacing: '-.01em',
      color: 'var(--text-primary)'
    }
  }, name), badge), React.createElement('div', {
    key: 'd',
    style: {
      marginTop: '3px',
      fontSize: 'var(--text-caption)',
      color: 'var(--text-secondary)',
      lineHeight: 1.5
    }
  }, description))), React.createElement('div', {
    key: 'f',
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: '11px'
    }
  }, React.createElement('span', {
    key: 's',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      color: enabled ? 'var(--text-secondary)' : 'var(--text-muted)'
    }
  }, stat), React.createElement('span', {
    key: 'w',
    onClick: e => e.stopPropagation(),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, React.createElement('span', {
    key: 'o',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '9px',
      letterSpacing: '.14em',
      color: enabled ? 'var(--accent)' : 'var(--text-muted)'
    }
  }, enabled ? 'ON' : 'OFF'), onToggle)));
}
Object.assign(__ds_scope, { ModuleCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/product/ModuleCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/App.jsx
try { (() => {
function App() {
  const {
    Toast,
    Button
  } = window.TobotDesignSystem_715bd9;
  const servers = [{
    id: 'ado',
    tag: 'AD',
    name: 'Adobos',
    members: '12,480'
  }, {
    id: 'gg',
    tag: 'GG',
    name: 'Rocket Lobby',
    members: '3,102'
  }, {
    id: 'es',
    tag: 'ES',
    name: 'Hispano Devs',
    members: '8,740'
  }];
  const [server, setServer] = React.useState('ado');
  const [view, setView] = React.useState('modules');
  const [toast, setToast] = React.useState(null);
  const notify = (t, d, tone = 'success') => {
    setToast({
      t,
      d,
      tone
    });
    clearTimeout(window.__tt);
    window.__tt = setTimeout(() => setToast(null), 3200);
  };
  const cur = servers.find(s => s.id === server);
  const views = {
    modules: /*#__PURE__*/React.createElement(window.ModulesView, {
      notify: notify,
      onOpen: () => setView('automod')
    }),
    automod: /*#__PURE__*/React.createElement(window.ModuleDetail, {
      notify: notify,
      onBack: () => setView('modules')
    }),
    logs: /*#__PURE__*/React.createElement(window.LogsView, null),
    billing: /*#__PURE__*/React.createElement(window.BillingView, {
      servers: servers
    })
  };
  const body = views[view] || /*#__PURE__*/React.createElement(window.Empty, {
    view: view
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100vh',
      fontSize: 'var(--text-body-s)'
    }
  }, /*#__PURE__*/React.createElement(ServerRail, {
    servers: servers,
    active: server,
    onPick: id => {
      setServer(id);
      setView('modules');
    }
  }), /*#__PURE__*/React.createElement(Sidebar, {
    view: view,
    onView: setView,
    server: cur
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, body), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      zIndex: 80
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: toast.tone,
    icon: /*#__PURE__*/React.createElement(DIcon, {
      n: toast.tone === 'success' ? 'check' : 'alert-triangle'
    }),
    title: toast.t,
    description: toast.d,
    onDismiss: () => setToast(null)
  })));
}
function Empty({
  view
}) {
  const {
    Button
  } = window.TobotDesignSystem_715bd9;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Topbar, {
    title: view[0].toUpperCase() + view.slice(1),
    crumb: "Adobos"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-4)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(DIcon, {
    n: "square-dashed",
    s: 28
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-h3)',
      color: 'var(--text-primary)'
    }
  }, "Aqu\xED todav\xEDa no hay nada"), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: '34ch',
      textAlign: 'center',
      color: 'var(--text-secondary)'
    }
  }, "Esta pantalla no forma parte del kit. S\xED lo son M\xF3dulos, Auto-mod, Action logs y Plan y facturaci\xF3n."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Volver a m\xF3dulos")));
}
Object.assign(window, {
  App,
  Empty
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/BillingView.jsx
try { (() => {
function BillingView({
  servers
}) {
  const {
    Card,
    Button,
    Badge,
    Switch,
    Tag
  } = window.TobotDesignSystem_715bd9;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Topbar, {
    title: "Plan y facturaci\xF3n",
    crumb: "Cuenta \xB7 tomas@adobos.gg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--dash-pad)',
      overflowY: 'auto',
      flex: 1,
      display: 'grid',
      gap: 'var(--space-4)',
      gridTemplateColumns: '1.4fr .6fr',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "accent",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    tone: "pro"
  }, "Pro"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-h2)',
      marginTop: '10px'
    }
  }, "$6 al mes, todos tus servidores"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: '8px',
      color: 'var(--text-secondary)',
      maxWidth: '46ch'
    }
  }, "Se cobra a tu cuenta, no por servidor. A\xF1ade una cuarta comunidad ma\xF1ana y esta cifra no se mueve.")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("div", null, "Renueva 12 sep 2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '4px'
    }
  }, "Visa \xB7\xB7\xB7\xB7 4242")))), /*#__PURE__*/React.createElement(Card, {
    title: "Servidores cubiertos",
    subtitle: "Todo lo de esta cuenta, sin coste extra.",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '8px'
    }
  }, servers.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '24px',
      height: '24px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-default)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '11px'
    }
  }, s.tag), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, s.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      color: 'var(--text-muted)'
    }
  }, s.members, " miembros"), /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    size: "sm",
    dot: true,
    style: {
      marginLeft: 'auto'
    }
  }, "Pro activo"))), /*#__PURE__*/React.createElement("button", {
    style: {
      all: 'unset',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 12px',
      border: '1px dashed var(--border-strong)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(DIcon, {
    n: "plus",
    s: 14
  }), " A\xF1ade otro servidor \u2014 siguen siendo $6"))), /*#__PURE__*/React.createElement(Card, {
    title: "Facturas",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '2px',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)'
    }
  }, [['12 ago 2026', '$6.00', 'Pagada'], ['12 jul 2026', '$6.00', 'Pagada'], ['12 jun 2026', '$6.00', 'Pagada']].map(([d, a, s]) => /*#__PURE__*/React.createElement("div", {
    key: d,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, d), /*#__PURE__*/React.createElement("span", null, a), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--success)'
    }
  }, s)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Uso",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '12px'
    }
  }, [['Retención de logs', '90 días', 'var(--accent)', .6], ['Mensajes programados', '7 / ilimitados', 'var(--secondary)', .1], ['Comandos ejecutados (30d)', '24.910', 'var(--success)', .8]].map(([k, v, c, p]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 'var(--text-caption)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, v)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '6px',
      height: '4px',
      borderRadius: '999px',
      background: 'var(--bg-inset)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: p * 100 + '%',
      height: '100%',
      background: c
    }
  })))))), /*#__PURE__*/React.createElement(Card, {
    title: "Preferencias de facturaci\xF3n",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: true,
    label: "Env\xEDame la factura por email"
  }), /*#__PURE__*/React.createElement(Switch, {
    checked: false,
    label: "Facturaci\xF3n anual",
    hint: "Dos meses gratis"
  })), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    fullWidth: true,
    style: {
      marginTop: '14px'
    }
  }, "Cambiar m\xE9todo de pago"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    fullWidth: true,
    style: {
      marginTop: '6px'
    }
  }, "Cancelar Pro")))));
}
window.BillingView = BillingView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/BillingView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Chrome.jsx
try { (() => {
function DIcon({
  n,
  s = 16,
  c
}) {
  const r = React.useRef(null);
  React.useEffect(() => {
    if (!r.current || !window.lucide) return;
    r.current.innerHTML = '';
    const k = n.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
    const d = lucide[k];
    if (!d) return;
    const el = lucide.createElement(d);
    el.setAttribute('width', s);
    el.setAttribute('height', s);
    el.setAttribute('stroke-width', 2);
    r.current.appendChild(el);
  }, [n, s]);
  return /*#__PURE__*/React.createElement("span", {
    ref: r,
    style: {
      display: 'flex',
      color: c
    }
  });
}
function ServerRail({
  servers,
  active,
  onPick
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '56px',
      flexShrink: 0,
      background: 'var(--bg-inset)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 0',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '34px',
      height: '34px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wm",
    style: {
      fontSize: '20px',
      color: 'var(--on-accent)'
    }
  }, "t")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '20px',
      height: '1px',
      background: 'var(--border-default)',
      margin: '4px 0'
    }
  }), servers.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.id,
    onClick: () => onPick(s.id),
    title: s.name,
    style: {
      all: 'unset',
      cursor: 'pointer',
      width: '34px',
      height: '34px',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '13px',
      background: active === s.id ? 'var(--bg-tint-accent)' : 'var(--bg-raised)',
      border: '1px solid ' + (active === s.id ? 'rgba(198,255,61,.35)' : 'var(--border-subtle)'),
      color: active === s.id ? 'var(--text-accent)' : 'var(--text-secondary)'
    }
  }, s.tag)), /*#__PURE__*/React.createElement("button", {
    style: {
      all: 'unset',
      cursor: 'pointer',
      width: '34px',
      height: '34px',
      borderRadius: 'var(--radius-md)',
      border: '1px dashed var(--border-strong)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(DIcon, {
    n: "plus",
    s: 15
  })));
}
function Sidebar({
  view,
  onView,
  server
}) {
  const {
    NavItem,
    Badge
  } = window.TobotDesignSystem_715bd9;
  const groups = [['Servidor', [['layout-grid', 'Módulos', 'modules'], ['scroll-text', 'Action logs', 'logs'], ['bar-chart-3', 'Estadísticas', 'stats']]], ['Moderación', [['shield-alert', 'Auto-mod', 'automod'], ['gavel', 'Casos', 'cases'], ['users-round', 'Roles', 'roles']]], ['Comunidad', [['trending-up', 'Niveles', 'levels'], ['coins', 'Economía', 'economy'], ['image', 'Welcome cards', 'cards']]], ['Cuenta', [['credit-card', 'Plan y facturación', 'billing'], ['settings', 'Ajustes', 'settings']]]];
  const pro = {
    automod: 1,
    economy: 1
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 'var(--sidebar-w)',
      flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--topbar-h)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '0 14px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '26px',
      height: '26px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-default)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '12px'
    }
  }, server.tag), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-label)',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, server.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, server.members, " members")), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(DIcon, {
    n: "chevrons-up-down",
    s: 14
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 10px',
      overflowY: 'auto',
      flex: 1
    }
  }, groups.map(([g, items]) => /*#__PURE__*/React.createElement("div", {
    key: g,
    style: {
      marginBottom: '14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ov",
    style: {
      padding: '0 10px 6px'
    }
  }, g), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '2px'
    }
  }, items.map(([ic, label, id]) => /*#__PURE__*/React.createElement(NavItem, {
    key: id,
    icon: /*#__PURE__*/React.createElement(DIcon, {
      n: ic
    }),
    label: label,
    active: view === id,
    onClick: () => onView(id),
    badge: pro[id] ? /*#__PURE__*/React.createElement(Badge, {
      tone: "pro",
      size: "sm"
    }, "Pro") : null
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-accent)',
      background: 'var(--bg-tint-accent)',
      borderRadius: 'var(--radius-md)',
      padding: '10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-label)',
      fontWeight: 600
    }
  }, "Pro cubre tus 3 servidores"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-secondary)',
      marginTop: '3px'
    }
  }, "Renueva 12 sep \xB7 $6/mo"))));
}
function Topbar({
  title,
  crumb,
  actions
}) {
  const {
    IconButton,
    Tooltip
  } = window.TobotDesignSystem_715bd9;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--topbar-h)',
      flexShrink: 0,
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      padding: '0 var(--dash-pad)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      minWidth: 0
    }
  }, crumb && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }
  }, crumb), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-h3)',
      letterSpacing: '-.01em',
      whiteSpace: 'nowrap',
      lineHeight: 1.15
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, actions, /*#__PURE__*/React.createElement(Tooltip, {
    label: "Estado del bot: en l\xEDnea"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)',
      padding: '0 8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '6px',
      height: '6px',
      borderRadius: '999px',
      background: 'var(--success)'
    }
  }), "42ms")), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(DIcon, {
      n: "book-open"
    }),
    label: "Docs",
    variant: "ghost"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '26px',
      height: '26px',
      borderRadius: '999px',
      background: 'var(--coal-700)',
      border: '1px solid var(--border-default)'
    }
  })));
}
Object.assign(window, {
  DIcon,
  ServerRail,
  Sidebar,
  Topbar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/LogsView.jsx
try { (() => {
function LogsView() {
  const {
    Tabs,
    Badge,
    Input,
    Button,
    IconButton,
    Tag,
    Tooltip
  } = window.TobotDesignSystem_715bd9;
  const [range, setRange] = React.useState('24h');
  const rows = [['10:24:07', 'MSG_DELETE', 'success', '#general', '@tomas', '1 mensaje · manual'], ['10:24:31', 'AUTOMOD', 'warning', '#general', '@rin', 'filter:links → timeout 10m'], ['10:25:02', 'WEBHOOK_401', 'danger', '—', 'system', 'retry in 30s'], ['10:31:44', 'ROLE_ADD', 'success', '#roles', '@kaori', '+@Verified via reaction'], ['10:33:12', 'MEMBER_JOIN', 'success', '#welcome', '@nao', 'card rendered · 84ms'], ['10:41:59', 'BAN', 'danger', '#mod-log', '@tomas', 'raid account · appeal open'], ['10:52:03', 'LEVEL_UP', 'success', '#general', '@kaori', 'lvl 41 → 42'], ['11:02:18', 'SCHEDULED', 'success', '#anuncios', 'system', 'sent · Europe/Madrid'], ['11:14:40', 'AUTOMOD', 'warning', '#memes', '@dai', 'filter:mentions → warn'], ['11:20:05', 'MSG_EDIT', 'success', '#general', '@rin', 'diff stored']];
  const tone = {
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)'
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Topbar, {
    title: "Action logs",
    crumb: "Adobos",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Input, {
      size: "sm",
      placeholder: "Filtrar eventos",
      prefix: "?",
      style: {
        width: '190px'
      }
    }), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      iconLeft: /*#__PURE__*/React.createElement(DIcon, {
        n: "download",
        s: 14
      })
    }, "Exportar"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--dash-pad)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "segmented",
    value: range,
    onChange: setRange,
    tabs: [{
      value: '1h',
      label: '1h'
    }, {
      value: '24h',
      label: '24h'
    }, {
      value: '7d',
      label: '7d'
    }, {
      value: '30d',
      label: '30d'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '6px'
    }
  }, ['moderation', 'automod', 'roles', 'economy'].map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    selected: t === 'automod',
    onClick: () => {}
  }, t))), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      color: 'var(--text-muted)'
    }
  }, "18.930 eventos \xB7 retenci\xF3n 90d")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-surface)',
      overflow: 'hidden',
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '88px 140px 110px 120px 1fr 36px',
      gap: '12px',
      padding: '10px var(--space-4)',
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--bg-raised)'
    }
  }, ['Hora', 'Evento', 'Canal', 'Actor', 'Detalle', ''].map(h => /*#__PURE__*/React.createElement("span", {
    key: h,
    className: "ov"
  }, h))), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto'
    }
  }, rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '88px 140px 110px 120px 1fr 36px',
      gap: '12px',
      alignItems: 'center',
      padding: '9px var(--space-4)',
      borderBottom: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, r[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      color: tone[r[2]]
    }
  }, r[1]), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, r[3]), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, r[4]), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-primary)'
    }
  }, r[5]), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Abrir caso",
    side: "left"
  }, /*#__PURE__*/React.createElement(IconButton, {
    size: "sm",
    icon: /*#__PURE__*/React.createElement(DIcon, {
      n: "external-link",
      s: 13
    }),
    label: "Open"
  }))))))));
}
window.LogsView = LogsView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/LogsView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/ModuleDetail.jsx
try { (() => {
function ModuleDetail({
  notify,
  onBack
}) {
  const {
    Card,
    Button,
    Switch,
    Input,
    Select,
    Checkbox,
    Radio,
    Tabs,
    Badge,
    Tag,
    Dialog,
    IconButton,
    Tooltip
  } = window.TobotDesignSystem_715bd9;
  const [tab, setTab] = React.useState('settings');
  const [enabled, setEnabled] = React.useState(true);
  const [punish, setPunish] = React.useState('mute');
  const [confirm, setConfirm] = React.useState(false);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Topbar, {
    title: "Auto-mod",
    crumb: "Adobos \xB7 M\xF3dulos",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Badge, {
      tone: "pro"
    }, "Pro"), /*#__PURE__*/React.createElement(Switch, {
      checked: enabled,
      onChange: e => {
        setEnabled(e.target.checked);
        notify(e.target.checked ? 'Auto-mod activado' : 'Auto-mod desactivado', 'Aplicado al instante.', e.target.checked ? 'success' : 'warning');
      },
      label: "Activo"
    }), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      onClick: onBack
    }, "Volver"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--dash-pad)',
      overflowY: 'auto',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    tabs: [{
      value: 'settings',
      label: 'Ajustes'
    }, {
      value: 'rules',
      label: 'Escalado',
      count: 3
    }, {
      value: 'logs',
      label: 'Reciente',
      count: 24
    }],
    style: {
      marginBottom: 'var(--space-5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr .7fr',
      gap: 'var(--space-4)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Filtros",
    subtitle: "Se aplican a cada mensaje nuevo dentro del alcance."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    checked: true,
    label: "Enlaces de invitaci\xF3n",
    hint: "Salvo los partners de abajo."
  }), /*#__PURE__*/React.createElement(Checkbox, {
    checked: true,
    label: "Menciones masivas",
    hint: "M\xE1s de 5 en un mensaje."
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Texto repetido"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    checked: true,
    label: "Lista de palabras",
    hint: "42 palabras \xB7 3 regex"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-4)',
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ov",
    style: {
      marginRight: '4px'
    }
  }, "Permitidos"), ['discord.gg/adobos', 'youtube.com', 'twitch.tv'].map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    mono: true,
    onRemove: () => {}
  }, t)), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    iconLeft: /*#__PURE__*/React.createElement(DIcon, {
      n: "plus",
      s: 13
    })
  }, "A\xF1adir"))), /*#__PURE__*/React.createElement(Card, {
    title: "Castigo",
    subtitle: "Primera infracci\xF3n, antes del escalado."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    label: "Al infringir",
    name: "p",
    value: punish,
    onChange: setPunish,
    options: [{
      value: 'warn',
      label: 'Avisar',
      hint: 'MD al miembro'
    }, {
      value: 'mute',
      label: 'Timeout',
      hint: '10 minutos'
    }, {
      value: 'kick',
      label: 'Expulsar'
    }, {
      value: 'ban',
      label: 'Banear',
      hint: 'Requiere Ban Members'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Registrar en",
    value: "mod",
    options: [{
      value: 'mod',
      label: '#mod-log'
    }, {
      value: 'audit',
      label: '#audit-trail'
    }]
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Borrar el mensaje tras",
    defaultValue: "0",
    mono: true,
    suffix: "segundos",
    hint: "0 lo borra al instante."
  })))), /*#__PURE__*/React.createElement(Card, {
    title: "Alcance",
    subtitle: "Canales y roles que este m\xF3dulo ignora.",
    tone: "default",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "sm"
    }, "Guardar alcance"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost"
    }, "Restablecer"), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }
    }, "Editado hace 4h por @tomas"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    }
  }, ['#mod-chat', '#staff', '#bot-tests'].map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    mono: true,
    icon: /*#__PURE__*/React.createElement(DIcon, {
      n: "hash",
      s: 12
    }),
    onRemove: () => {}
  }, t.slice(1))), ['@Moderator', '@Admin'].map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    mono: true,
    onRemove: () => {}
  }, t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "raised",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ov"
  }, "\xDAltimos 30 d\xEDas"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '10px',
      marginTop: '12px'
    }
  }, [['Mensajes filtrados', '412'], ['Timeouts aplicados', '37'], ['Falsos positivos', '2'], ['Reglas escaladas', '9']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)',
      fontSize: 'var(--text-caption)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-body-s)'
    }
  }, v))))), /*#__PURE__*/React.createElement(Card, {
    tone: "accent",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-h4)'
    }
  }, "C\xF3pialo a tus otros servidores"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: '6px',
      fontSize: 'var(--text-caption)',
      color: 'var(--text-secondary)',
      lineHeight: 1.5
    }
  }, "Rocket Lobby e Hispano Devs est\xE1n en la misma suscripci\xF3n. Mismos filtros, un clic."), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    style: {
      marginTop: '12px'
    },
    iconRight: /*#__PURE__*/React.createElement(DIcon, {
      n: "arrow-right",
      s: 14
    })
  }, "Copiar configuraci\xF3n")), /*#__PURE__*/React.createElement(Card, {
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ov"
  }, "Zona peligrosa"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 12px',
      fontSize: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, "Borra todos los filtros, reglas y listas de permitidos de este servidor."), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "destructive",
    onClick: () => setConfirm(true)
  }, "Reiniciar auto-mod"))))), /*#__PURE__*/React.createElement(Dialog, {
    open: confirm,
    tone: "danger",
    title: "\xBFReiniciar auto-mod?",
    onClose: () => setConfirm(false),
    description: "Se van todos los filtros, reglas de escalado y permitidos de Adobos. Tus otros servidores no se tocan.",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setConfirm(false)
    }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
      variant: "destructive",
      onClick: () => {
        setConfirm(false);
        notify('Auto-mod reiniciado', 'Filtros borrados en Adobos.', 'danger');
      }
    }, "Restablecer"))
  }));
}
window.ModuleDetail = ModuleDetail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/ModuleDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/ModulesView.jsx
try { (() => {
function ModulesView({
  notify,
  onOpen
}) {
  const {
    ModuleCard,
    Switch,
    Button,
    Tabs,
    Input,
    Badge,
    IconButton
  } = window.TobotDesignSystem_715bd9;
  const all = [['shield-alert', 'Auto-mod', 'Filtros y castigos escalonados.', 'pro', '412 filtrados · 30d'], ['image', 'Welcome cards', 'Joins, salidas, bans y boosts en canvas.', 'free', '1.204 renderizadas · 30d'], ['scroll-text', 'Action logs', 'Enrutado granular por canal.', 'free', '18.930 eventos · 30d'], ['user-plus', 'Autoroles', 'Por reacción, botón y menú.', 'free', '96 asignados · 30d'], ['trending-up', 'Niveles', 'XP de texto y voz.', 'free', 'Top: @kaori · nvl 42'], ['coins', 'Economía', 'Banco, trabajos, tienda y casino.', 'pro', 'Apagado'], ['clipboard-list', 'Formularios', 'Modales que escriben en un canal.', 'free', '23 respuestas · 30d'], ['calendar-clock', 'Programados', 'Zona horaria por mensaje.', 'free', '7 en cola'], ['terminal', 'Comandos custom', 'Tuyos, no nuestros.', 'free', '14 comandos'], ['timer', 'Auto-borrado', 'Limpieza programada.', 'free', 'Apagado'], ['swords', 'Pokémon', 'PokéAPI y Smogon.', 'pro', 'Apagado'], ['webhook', 'Webhooks', 'Reenvía eventos a donde quieras.', 'free', '3 endpoints']];
  const [on, setOn] = React.useState({
    'Auto-mod': 1,
    'Welcome cards': 1,
    'Action logs': 1,
    'Autoroles': 1,
    'Niveles': 1,
    'Formularios': 1,
    'Programados': 1,
    'Comandos custom': 1,
    'Webhooks': 1
  });
  const [tab, setTab] = React.useState('all');
  const [view, setView] = React.useState('grid');
  const toggle = name => {
    const next = {
      ...on
    };
    if (next[name]) {
      delete next[name];
      notify(name + ' desactivado', 'La configuración se conserva.', 'warning');
    } else {
      next[name] = 1;
      notify(name + ' activado', 'Aplicado a Adobos al instante.');
    }
    setOn(next);
  };
  const list = tab === 'all' ? all : tab === 'on' ? all.filter(m => on[m[1]]) : all.filter(m => m[3] === 'pro');
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Topbar, {
    title: "M\xF3dulos",
    crumb: "Adobos",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Input, {
      size: "sm",
      placeholder: "Buscar m\xF3dulos",
      prefix: "/",
      style: {
        width: '200px'
      }
    }), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      iconLeft: /*#__PURE__*/React.createElement(DIcon, {
        n: "copy",
        s: 14
      })
    }, "Copiar a otro servidor"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--dash-pad)',
      overflowY: 'auto',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "segmented",
    value: tab,
    onChange: setTab,
    tabs: [{
      value: 'all',
      label: 'Todos',
      count: 18
    }, {
      value: 'on',
      label: 'Activos',
      count: Object.keys(on).length
    }, {
      value: 'pro',
      label: 'Pro'
    }]
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      color: 'var(--text-muted)'
    }
  }, "los cambios se aplican al instante"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '2px'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    size: "sm",
    variant: view === 'grid' ? 'outline' : 'ghost',
    active: view === 'grid',
    icon: /*#__PURE__*/React.createElement(DIcon, {
      n: "layout-grid",
      s: 14
    }),
    label: "Rejilla",
    onClick: () => setView('grid')
  }), /*#__PURE__*/React.createElement(IconButton, {
    size: "sm",
    variant: view === 'list' ? 'outline' : 'ghost',
    active: view === 'list',
    icon: /*#__PURE__*/React.createElement(DIcon, {
      n: "list",
      s: 14
    }),
    label: "Lista",
    onClick: () => setView('list')
  }))), view === 'grid' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
      gap: '16px'
    }
  }, list.map(([ic, name, desc, tier, stat]) => /*#__PURE__*/React.createElement(ModuleCard, {
    key: name,
    name: name,
    description: desc,
    tier: tier,
    enabled: !!on[name],
    stat: stat,
    icon: /*#__PURE__*/React.createElement(DIcon, {
      n: ic,
      s: 18
    }),
    onOpen: name === 'Auto-mod' ? onOpen : undefined,
    onToggle: /*#__PURE__*/React.createElement(Switch, {
      size: "sm",
      checked: !!on[name],
      onChange: () => toggle(name)
    })
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--bg-surface)'
    }
  }, list.map(([ic, name, desc, tier, stat], i) => /*#__PURE__*/React.createElement(ModuleCard, {
    layout: "row",
    index: i + 1,
    key: name,
    name: name,
    description: desc,
    tier: tier,
    enabled: !!on[name],
    stat: stat,
    icon: /*#__PURE__*/React.createElement(DIcon, {
      n: ic,
      s: 17
    }),
    onOpen: name === 'Auto-mod' ? onOpen : undefined,
    onToggle: /*#__PURE__*/React.createElement(Switch, {
      size: "sm",
      checked: !!on[name],
      onChange: () => toggle(name)
    })
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-5)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-4)',
      border: '1px dashed var(--border-default)',
      borderRadius: 'var(--radius-lg)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(DIcon, {
    n: "info"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, "Hay seis m\xF3dulos m\xE1s. Todo lo que actives aqu\xED se puede copiar a tus otros dos servidores en un clic."), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    style: {
      marginLeft: 'auto'
    }
  }, "Ver los 18"))));
}
window.ModulesView = ModulesView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/ModulesView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Faq.jsx
try { (() => {
function Faq() {
  const {
    Button,
    Accordion
  } = window.TobotDesignSystem_715bd9;
  const [open, setOpen] = React.useState(0);
  const qs = [['¿La capa gratis es una prueba?', 'No. Quince módulos son gratis sin límite de tiempo y sin cobro por servidor. Pro añade tres módulos pesados, más retención de logs y cola prioritaria.'], ['¿Qué pasa si dejo de pagar?', 'Los módulos Pro se apagan y tu configuración se queda. No se borra nada y no se secuestra nada.'], ['¿Puedo self-hostearlo?', 'Sí. Es un solo proceso Node que mantiene el socket del gateway y sirve el dashboard. El plan alojado existe para que no tengas que hacerlo.'], ['¿Una suscripción cubre de verdad todos mis servidores?', 'Sí, los de tu cuenta. Tres comunidades, una factura. Esa es toda la idea.']];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
    style: {
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '.7fr 1.3fr',
      gap: 'var(--space-16)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '12px',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '.16em',
      color: 'var(--accent)'
    }
  }, "04 /"), /*#__PURE__*/React.createElement(Overline, null, "Preguntas")), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 'var(--space-4)',
      fontSize: 'var(--text-h1)',
      lineHeight: 'var(--lh-h1)'
    }
  }, "Respondidas antes de que preguntes")), /*#__PURE__*/React.createElement(Accordion, {
    items: qs.map(([title, content]) => ({
      title,
      content
    }))
  }))), /*#__PURE__*/React.createElement(Section, {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--text-display-m)',
      lineHeight: 'var(--lh-display-m)',
      letterSpacing: 'var(--ls-display-m)',
      maxWidth: '20ch',
      margin: '0 auto'
    }
  }, "Enciende un m\xF3dulo. Luego decides."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-6)',
      display: 'flex',
      gap: 'var(--space-3)',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg"
  }, "A\xF1adir a Discord"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "ghost"
  }, "Leer los docs"))));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-subtle)',
      padding: 'var(--space-10) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap",
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 'var(--space-8)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wm",
    style: {
      fontSize: '20px'
    }
  }, "tobot", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, ".")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-6)',
      fontSize: 'var(--text-caption)'
    }
  }, ['Status', 'Docs', 'Changelog', 'Terms', 'Privacy'].map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      color: 'var(--text-muted)',
      borderBottom: 'none'
    }
  }, l))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-overline)',
      color: 'var(--text-muted)'
    }
  }, "Hecho para el servidor Adobos. Ahora para el tuyo.")));
}
Object.assign(window, {
  Faq,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Faq.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Hero.jsx
try { (() => {
function Hero() {
  const {
    Button,
    Badge
  } = window.TobotDesignSystem_715bd9;
  const stack = [['welcome bot', '$3 · por servidor'], ['logging bot', '$4 · por servidor'], ['levels bot', '$3 · por servidor'], ['economy bot', 'gratis, con ads'], ['automod bot', '$5 · por servidor'], ['forms bot', '$2 · por servidor']];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(circle at 1px 1px,var(--bg-base) 1.1px,transparent 1.2px),var(--dither-gradient)',
      backgroundSize: '3px 3px,100% 100%',
      backgroundRepeat: 'repeat,no-repeat'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap",
    style: {
      display: 'grid',
      gridTemplateColumns: '1.15fr .85fr',
      gap: 'var(--space-16)',
      padding: '104px 24px 88px',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '12px',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '.16em',
      color: 'var(--accent)'
    }
  }, "01 /"), /*#__PURE__*/React.createElement(Overline, null, "El problema")), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 'var(--space-5)',
      fontSize: 'var(--text-display-l)',
      lineHeight: 'var(--lh-display-l)',
      letterSpacing: 'var(--ls-display-l)',
      fontWeight: 800
    }
  }, "Seis bots hacen el trabajo.", /*#__PURE__*/React.createElement("br", null), "Con uno", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, " deber\xEDa bastar.")), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-6)',
      fontSize: 'var(--text-body-l)',
      lineHeight: 1.6,
      color: 'var(--text-secondary)',
      maxWidth: '52ch'
    }
  }, "Moderaci\xF3n, logs, bienvenidas, niveles, econom\xEDa, formularios y automatizaci\xF3n en un solo sitio. Una suscripci\xF3n cubre todos tus servidores, no uno."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg"
  }, "A\xF1adir a Discord"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary"
  }, "Ver los 18 m\xF3dulos")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-5)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      color: 'var(--text-muted)'
    }
  }, "// sin tarjeta \xB7 15 de 18 m\xF3dulos gratis para siempre, en todos tus servidores")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-surface)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-4) var(--space-5)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ov"
  }, "Tu stack actual"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      color: 'var(--danger)'
    }
  }, "$17/mo \xD7 3 servidores")), stack.map(([n, p], i) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '11px var(--space-5)',
      borderBottom: '1px solid var(--border-subtle)',
      opacity: .55
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-s)',
      textDecoration: 'line-through',
      textDecorationColor: 'var(--danger)'
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      color: 'var(--text-muted)'
    }
  }, p))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'var(--space-4) var(--space-5)',
      background: 'var(--bg-tint-accent)',
      borderTop: '1px solid var(--accent)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wm",
    style: {
      fontSize: '20px'
    }
  }, "tobot", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, ".")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono)',
      color: 'var(--text-primary)'
    }
  }, "$6/mo \xB7 TODOS tus servidores")))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Modules.jsx
try { (() => {
function Modules() {
  const {
    Badge,
    Tag
  } = window.TobotDesignSystem_715bd9;
  const PRO = ['Auto-mod', 'Economy', 'Pokémon'];
  return /*#__PURE__*/React.createElement(Section, {
    id: "modules",
    style: {
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '12px',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '.16em',
      color: 'var(--accent)'
    }
  }, "02 /"), /*#__PURE__*/React.createElement(Overline, null, "El muro")), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 'var(--space-4)',
      fontSize: 'var(--text-display-m)',
      lineHeight: 'var(--lh-display-m)',
      letterSpacing: 'var(--ls-display-m)'
    }
  }, "Dieciocho m\xF3dulos que ya se conocen entre s\xED")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-body-s)',
      color: 'var(--text-secondary)',
      maxWidth: '34ch'
    }
  }, "Los niveles pagan en la econom\xEDa. El auto-mod escribe en tus logs. Los formularios reparten roles. Nada que cablear.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-10)',
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: '1px',
      background: 'var(--border-subtle)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }
  }, MODULES.map(([ic, name, desc]) => /*#__PURE__*/React.createElement("div", {
    key: name,
    style: {
      background: 'var(--bg-surface)',
      padding: 'var(--space-5)',
      display: 'flex',
      gap: 'var(--space-4)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: '2px',
      color: PRO.includes(name) ? 'var(--text-accent)' : 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: ic,
    s: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--text-h4)'
    }
  }, name), PRO.includes(name) && /*#__PURE__*/React.createElement(Badge, {
    tone: "pro",
    size: "sm"
  }, "Pro")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '3px',
      fontSize: 'var(--text-caption)',
      color: 'var(--text-secondary)',
      lineHeight: 1.5
    }
  }, desc))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-6)',
      display: 'flex',
      gap: 'var(--space-2)',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ov",
    style: {
      marginRight: 'var(--space-2)'
    }
  }, "Sustituye a"), ['welcome bots', 'logging bots', 'levels bots', 'economy bots', 'automod bots', 'form bots'].map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t))));
}
window.Modules = Modules;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Modules.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Nav.jsx
try { (() => {
function Nav() {
  const {
    Button,
    Badge,
    Ticker
  } = window.TobotDesignSystem_715bd9;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ticker, {
    items: ['One bot, one bill', '18 módulos', '15 gratis', 'Por cuenta, no por servidor']
  }), /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(8,10,8,.88)',
      borderBottom: '1px solid var(--border-subtle)',
      backdropFilter: 'blur(6px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap",
    style: {
      height: '62px',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wm",
    style: {
      fontSize: '24px'
    }
  }, "tobot", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, ".")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 'var(--space-6)'
    }
  }, ['Módulos', 'Pricing', 'Docs', 'Changelog'].map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: '#' + l.toLowerCase(),
    className: "ov",
    style: {
      color: 'var(--text-muted)',
      borderBottom: 'none'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ov"
  }, "18 m\xF3dulos \xB7 15 gratis"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Log in"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm"
  }, "A\xF1adir a Discord")))));
}
window.Nav = Nav;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Nav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Pricing.jsx
try { (() => {
function Pricing() {
  const {
    Button,
    Badge,
    Slider
  } = window.TobotDesignSystem_715bd9;
  const [servers, setServers] = React.useState(3);
  const rival = servers * 17,
    ours = 6;
  const rows = [['Módulos incluidos', '15 de 18', 'Los 18'], ['Servidores por suscripción', 'Ilimitados', 'Ilimitados'], ['Retención de logs', '7 días', '90 días'], ['Mensajes programados', '10', 'Ilimitados'], ['Filtros de auto-mod', '—', 'Con escalado'], ['Economía y casino', '—', 'Incluido'], ['Plugin de Pokémon', '—', 'Incluido'], ['Soporte', 'Comunidad', 'Cola prioritaria']];
  return /*#__PURE__*/React.createElement(Section, {
    id: "pricing",
    style: {
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '.9fr 1.1fr',
      gap: 'var(--space-16)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '12px',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '.16em',
      color: 'var(--accent)'
    }
  }, "03 /"), /*#__PURE__*/React.createElement(Overline, null, "Pricing")), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 'var(--space-4)',
      fontSize: 'var(--text-display-m)',
      lineHeight: 'var(--lh-display-m)',
      letterSpacing: 'var(--ls-display-m)'
    }
  }, "Por cuenta.", /*#__PURE__*/React.createElement("br", null), "No por servidor."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-5)',
      fontSize: 'var(--text-body)',
      color: 'var(--text-secondary)',
      maxWidth: '42ch'
    }
  }, "Los dem\xE1s te vuelven a cobrar por el mismo bot. Mueve el deslizador y mira lo que te cuesta."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5)',
      background: 'var(--bg-surface)'
    }
  }, /*#__PURE__*/React.createElement(Slider, {
    label: "Servidores que administras",
    min: 1,
    max: 12,
    value: servers,
    onChange: setServers,
    ticks: ['1', '12']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-5)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-3)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ov"
  }, "Stack t\xEDpico"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '22px',
      marginTop: '6px',
      color: 'var(--danger)'
    }
  }, "$", rival, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12px',
      color: 'var(--text-muted)'
    }
  }, "/mo"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-3)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-accent)',
      background: 'var(--bg-tint-accent)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ov",
    style: {
      color: 'var(--text-accent)'
    }
  }, "Tobot Pro"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '22px',
      marginTop: '6px'
    }
  }, "$", ours, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12px',
      color: 'var(--text-muted)'
    }
  }, "/mo")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--bg-surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr 1fr'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5)',
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ov"
  }, "Qu\xE9 incluye")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5)',
      borderBottom: '1px solid var(--border-default)',
      borderLeft: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "free"
  }, "Free"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-h3)',
      marginTop: '8px'
    }
  }, "$0")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5)',
      borderBottom: '1px solid var(--border-accent)',
      borderLeft: '1px solid var(--border-subtle)',
      background: 'var(--bg-tint-accent)'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "pro"
  }, "Pro"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-h3)',
      marginTop: '8px'
    }
  }, "$6", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12px',
      color: 'var(--text-muted)'
    }
  }, "/mo"))), rows.map(([label, a, b], i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: label
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px var(--space-5)',
      borderBottom: '1px solid var(--border-subtle)',
      fontSize: 'var(--text-body-s)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px var(--space-5)',
      borderBottom: '1px solid var(--border-subtle)',
      borderLeft: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      color: a === '—' ? 'var(--text-muted)' : 'var(--text-secondary)'
    }
  }, a), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px var(--space-5)',
      borderBottom: '1px solid var(--border-subtle)',
      borderLeft: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-mono-s)',
      background: 'rgba(198,255,61,.05)'
    }
  }, b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      padding: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true
  }, "Empezar gratis"), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true
  }, "Pasar a Pro")))));
}
window.Pricing = Pricing;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Pricing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Shared.jsx
try { (() => {
function Icon({
  n,
  s = 16,
  c
}) {
  const r = React.useRef(null);
  React.useEffect(() => {
    if (!r.current || !window.lucide) return;
    r.current.innerHTML = '';
    const key = n.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
    const def = lucide[key];
    if (!def) return;
    const el = lucide.createElement(def);
    el.setAttribute('width', s);
    el.setAttribute('height', s);
    el.setAttribute('stroke-width', 2);
    r.current.appendChild(el);
  }, [n, s]);
  return /*#__PURE__*/React.createElement("span", {
    ref: r,
    style: {
      display: 'flex',
      color: c
    }
  });
}
function Overline({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ov",
    style: style
  }, children);
}
function Section({
  children,
  style,
  id
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: id,
    style: {
      padding: 'var(--section-y) 0',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, children));
}
const MODULES = [['message-square', 'Embeds & messages', 'Visual builder, no JSON'], ['image', 'Welcome cards', 'Canvas-rendered joins, bans, boosts'], ['user-plus', 'Autoroles', 'Reaction, button and menu roles'], ['scroll-text', 'Action logs', 'Per-channel routing and webhooks'], ['shield-alert', 'Auto-mod', 'Filters with escalating punishment'], ['timer', 'Auto-delete', 'Scheduled channel cleanup'], ['clipboard-list', 'Forms', 'Interactive modals, answers to a channel'], ['calendar-clock', 'Scheduled messages', 'Per-message timezone'], ['terminal', 'Custom commands', 'Yours, not ours'], ['trending-up', 'Levels', 'Text and voice XP'], ['coins', 'Economy', 'Bank, jobs, shop'], ['dices', 'Casino', 'Roulette, blackjack, coinflip'], ['gavel', 'Moderation', 'Backed by Discord audit log'], ['users-round', 'Role builder', 'Hierarchy without the fights'], ['swords', 'Pokémon', 'PokéAPI and Smogon data'], ['mouse-pointer-click', 'Buttons & menus', 'Components on any message'], ['webhook', 'Webhooks', 'Fan out anywhere'], ['bar-chart-3', 'Server stats', 'Who talks, where, when']];
Object.assign(window, {
  Icon,
  Overline,
  Section,
  MODULES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Shared.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.LogRow = __ds_scope.LogRow;

__ds_ns.Progress = __ds_scope.Progress;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.ChannelPicker = __ds_scope.ChannelPicker;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Slider = __ds_scope.Slider;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TimezoneSelect = __ds_scope.TimezoneSelect;

__ds_ns.PricingTier = __ds_scope.PricingTier;

__ds_ns.Ticker = __ds_scope.Ticker;

__ds_ns.Accordion = __ds_scope.Accordion;

__ds_ns.CommandPalette = __ds_scope.CommandPalette;

__ds_ns.Menu = __ds_scope.Menu;

__ds_ns.NavItem = __ds_scope.NavItem;

__ds_ns.Stepper = __ds_scope.Stepper;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.EmbedPreview = __ds_scope.EmbedPreview;

__ds_ns.ModuleCard = __ds_scope.ModuleCard;

})();
