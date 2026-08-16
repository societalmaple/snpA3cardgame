import { FONTS, useStore } from '../store.ts';
import styles from './FontSelect.module.css';

export function FontSelect() {
  const { font, setFont } = useStore();
  return (
    <select
      className={styles.select}
      value={font}
      onChange={(e) => setFont(e.target.value)}
      aria-label="Select font"
      title="Select font"
    >
      {FONTS.map((f) => (
        <option key={f.name} value={f.family}>
          {f.name}
        </option>
      ))}
    </select>
  );
}