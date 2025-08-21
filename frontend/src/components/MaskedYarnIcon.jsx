import yarnIconUrl from '../assets/yarnball.svg';

export default function MaskedYarnIcon({
  color = '#AABBCC',
  size = 48,
  className = '',
  style = {},
}) {
  const px = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'inline-block',
        width: px,
        height: px,
        minWidth: px,
        minHeight: px,
        maxWidth: px,
        maxHeight: px,
        backgroundColor: color,
        WebkitMask: `url(${yarnIconUrl}) center / contain no-repeat`,
        mask: `url(${yarnIconUrl}) center / contain no-repeat`,
        ...style,
      }}
    />
  );
}

