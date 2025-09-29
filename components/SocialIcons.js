"use client";

import { SocialIcon } from 'react-social-icons';

export default function SocialIcons({ data }) {
  const { icons = [], size = 40, fgColor = '#ffffff', bgColor, alignment = 'center' } = data || {};
  if (!Array.isArray(icons) || icons.length === 0) return null;
  return (
    <div style={{ textAlign: alignment, margin: '0 0 1rem' }}>
      {icons.map((icon, i) => (
        <SocialIcon
          key={i}
          url={icon.url}
          fgColor={icon.fgColor || fgColor}
          bgColor={icon.bgColor || bgColor}
          style={{ height: size, width: size, margin: '0 6px' }}
        />
      ))}
    </div>
  );
}
