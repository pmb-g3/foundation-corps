// Mode edit langsung dari tampilan website (F-51): pensil di tiap bagian membuka panel editor.
// Panel editor (bagian dari panel admin) dimuat hanya setelah login.
import { Suspense, createContext, lazy, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from './auth.jsx';

const PanelEditor = lazy(() => import('../pages/admin/editor/PanelEditor.jsx'));
const EditorContext = createContext({ buka: () => {}, bisa: () => false });

/**
 * target editor:
 *  { jenis: 'hero' | 'teks' | 'program' | 'sektor_kartu' | 'footer' | 'tabel' | 'pengaturan',
 *    bagian?, sheet?, sektor?, judul?, setelahSimpan?: () => void }
 */
export function EditorProvider({ children }) {
  const auth = useAuth();
  const [target, setTarget] = useState(null);

  /** Bolehkah pengguna mengedit sektor ini (Admin: semua; Kabag: sektornya)? */
  const bisa = useCallback(
    (sektor) => auth.modeEdit && (auth.isAdmin || (sektor && auth.isKabag && auth.sektorKabag === sektor)),
    [auth.modeEdit, auth.isAdmin, auth.isKabag, auth.sektorKabag]
  );

  const nilai = useMemo(() => ({ buka: setTarget, bisa }), [bisa]);
  return (
    <EditorContext.Provider value={nilai}>
      {children}
      {auth.masukLogin && target && (
        <Suspense fallback={null}>
          <PanelEditor target={target} tutup={() => setTarget(null)} />
        </Suspense>
      )}
    </EditorContext.Provider>
  );
}

export const useEditor = () => useContext(EditorContext);
