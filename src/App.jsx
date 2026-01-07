import { useRef, useState } from 'react';
import './index.css';

// --- Services & Hooks ---
import {
  updateCategoryName,
  saveQRCodeToDB,
  updateQRCodeInDB,
  deleteQRCodeById
} from './services/db';
import { exportBackup, importBackup } from './utils/dataTransfer';
import useAppData from './hooks/useAppData';
import useQRScanner from './hooks/useQRScanner';

// --- UI Components ---
import StatusBar from './components/ui/StatusBar';
import FixedButtons from './components//ui/FixedButtons';
import CategoryCarousel from './components/domain/CategoryCarousel/CategoryCarousel';
import CategoryEditList from './components/domain/CategoryEditList';

// --- Modals ---
import CreateCategoryModal from './components/modals/CreateCategoryModal';
import EditCategoryModal from './components/modals/EditCategoryModal';
import NewQRModal from './components/modals/NewQRModal';
import EditQRModal from './components/modals/EditQRModal';

/**
 * @typedef {import('./services/db').Category} Category
 * @typedef {import('./services/db').QRCode} QRCode
 */

export default function App() {
  const {
    categories,
    categoryCardLists,
    selectedCategoryId,
    setSelectedCategoryId,
    reloadCategories,
    handleAddCategory,
    handleDeleteCategory,
    handleReorderCategories,
    handleCardChange
  } = useAppData();

  // Initialize scanner here as modals need access to video
  const scanner = useQRScanner();

  // --- Modal States ---
  const [isFormOpen, setIsFormOpen] = useState(false); // New Category
  const [isEditFormOpen, setIsEditFormOpen] = useState(false); // Edit Category
  /** @type {[Category | null, React.Dispatch<React.SetStateAction<Category | null>>]} */
  const [editingCategory, setEditingCategory] = useState(null);

  const [isQRFormOpen, setIsQRFormOpen] = useState(false); // New QR
  const [isEditQRFormOpen, setIsEditQRFormOpen] = useState(false); // Edit QR (Details)
  /** @type {[QRCode | null, React.Dispatch<React.SetStateAction<QRCode | null>>]} */
  const [editingCard, setEditingCard] = useState(null);

  const [isEditMode, setIsEditMode] = useState(false);

  // --- Handlers: Category ---
  /** @param {string} name */
  const onNewCategory = async (name) => {
    try {
      await handleAddCategory(name);
      setIsFormOpen(false);
    } catch (e) { alert("Error creating category"); }
  };

  /**
   * @param {number} id
   * @param {string} name
   */
  const onEditCategory = async (id, name) => {
    try {
      await updateCategoryName(id, name.trim());
      await reloadCategories();
      setIsEditFormOpen(false);
      setEditingCategory(null);
    } catch (e) { alert("Error updating category"); }
  };

  /** @param {Category} cat */
  const openEditCatModal = (cat) => {
    setEditingCategory(cat);
    setIsEditFormOpen(true);
  };

  // --- Handlers: QR Codes ---
  /**
   * @param {Object} params
   * @param {string} params.title
   * @param {string} params.qrData
   * @param {number|string} params.categoryId
   * @param {SVGSVGElement} params.svgRef
   */
  const onSaveNewQR = async ({ title, qrData, categoryId, svgRef }) => {
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgRef);
      const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
      const targetCatId = Number(categoryId);

      const saved = await saveQRCodeToDB({
        categoryId: targetCatId,
        title,
        qrData,
        qrImageDataUrl: dataUrl,
      });

      // saved.id is optional in type, but DB guarantees return
      if (saved.id) {
        await handleCardChange(targetCatId, saved.id);
      }
      await reloadCategories();
      setSelectedCategoryId(targetCatId);
      setIsQRFormOpen(false);
    } catch (err) {
      // @ts-ignore
      console.error(err);
      // @ts-ignore
      alert('Error saving QR: ' + err.message);
    }
  };

  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {string} params.title
   * @param {string} params.qrData
   * @param {number|string} params.categoryId
   * @param {SVGSVGElement} [params.svgRef]
   */
  const onUpdateQR = async ({ id, title, qrData, categoryId, svgRef }) => {
    try {
      /** @type {string | undefined} */
      let newDataUrl = undefined;
      if (svgRef) {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgRef);
        newDataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
      }

      await updateQRCodeInDB({
        id,
        categoryId: Number(categoryId),
        title,
        qrData,
        // If newDataUrl is undefined, db.js preserves the old image
        qrImageDataUrl: newDataUrl || "",
        // Timestamp is required in type but ignored in update logic
        timestamp: 0
      });
      await reloadCategories();
      setIsEditQRFormOpen(false);
    } catch (err) {
      // @ts-ignore
      alert('Error updating QR: ' + err.message);
    }
  };

  /** @param {number} id */
  const onDeleteQR = async (id) => {
    await deleteQRCodeById(id);
    await reloadCategories();
    setIsEditQRFormOpen(false);
    scanner.setIsCameraOpen(false);
  };

  /** @param {QRCode} card */
  const openDetails = (card) => {
    if (!card) return;
    setEditingCard(card);
    setIsEditQRFormOpen(true);
  };

  // --- Import/Export ---
  /** @type {React.MutableRefObject<HTMLInputElement | null>} */
  const importInputRef = useRef(null);

  const handleExportData = async () => {
    // @ts-ignore
    try { await exportBackup(); } catch (err) { alert(err.message); }
  };

  /** @param {React.ChangeEvent<HTMLInputElement>} event */
  const handleImportFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    event.target.value = '';
    try {
      await importBackup(file);
      await reloadCategories();
    } catch (err) {
      // @ts-ignore
      alert("Import failed: " + err.message);
    }
  };

  return (
    <div className="app-root w-full overflow-x-hidden relative">
      <StatusBar />

      <main className="w-full max-w-[1280px] mx-auto text-center pt-[env(safe-area-inset-top)] min-h-screen flex flex-col">
        <div className="mt-6 flex-1 flex flex-col items-center relative">

          <FixedButtons
            onEditMode={() => setIsEditMode(prev => !prev)}
            onOpenForm={() => setIsFormOpen(true)}
            onExport={handleExportData}
            onImport={() => importInputRef.current?.click()}
            onAddQR={() => setIsQRFormOpen(true)}
            hasCategories={categories.length > 0}
            isEditMode={isEditMode}
          />

          <input
            type="file" ref={importInputRef} accept=".json"
            className="hidden" onChange={handleImportFile}
          />
          {/* Scanner file input is handled inside modals via scanner.handleImageScan */}

          {/* --- MAIN CONTENT --- */}
          {isEditMode ? (
            <CategoryEditList
              categories={categories}
              onDelete={handleDeleteCategory}
              onEditName={openEditCatModal}
              onReorder={handleReorderCategories}
            />
          ) : (
            <div className="w-full max-w-[720px] pt-10 animate-fadeIn">
              {categories.map(cat => (
                <section key={cat.id} className="mb-10">
                  <div className="w-full max-w-[345px] mx-auto mb-4 px-6 box-border flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-color)] text-left break-words whitespace-pre-wrap leading-tight flex-1 min-w-0">
                      {cat.name}
                    </h2>
                  </div>
                  <CategoryCarousel
                    category={cat}
                    cards={categoryCardLists[Number(cat.id)] || []}
                    onCardChange={handleCardChange}
                    onCopy={(data) => navigator.clipboard.writeText(data)}
                    onEdit={openDetails}
                  />
                </section>
              ))}
            </div>
          )}

          {/* --- MODALS --- */}
          <CreateCategoryModal
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={onNewCategory}
          />

          <EditCategoryModal
            isOpen={isEditFormOpen}
            onClose={() => { setIsEditFormOpen(false); setEditingCategory(null); }}
            onSubmit={onEditCategory}
            category={editingCategory}
          />

          <NewQRModal
            isOpen={isQRFormOpen}
            onClose={() => setIsQRFormOpen(false)}
            onSubmit={onSaveNewQR}
            categories={categories}
            defaultCategoryId={selectedCategoryId || ""}
            scanner={scanner}
          />

          <EditQRModal
            isOpen={isEditQRFormOpen}
            onClose={() => { setIsEditQRFormOpen(false); setEditingCard(null); }}
            onSubmit={onUpdateQR}
            onDelete={onDeleteQR}
            card={editingCard}
            categories={categories}
            scanner={scanner}
          />

        </div>
      </main>
    </div>
  );
}