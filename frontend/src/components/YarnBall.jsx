import MaskedYarnIcon from './MaskedYarnIcon';

export default function YarnBall({ colour = '#bbb', size = 44, label = '' }) {
  return (
    <div className="tooltip" data-tip={label || colour}>
      <div className="rounded-full shadow-md flex items-center justify-center"
           style={{ width: size, height: size, background: 'transparent' }}>
        <MaskedYarnIcon color={colour} size={size} />
      </div>
    </div>
  );
}
