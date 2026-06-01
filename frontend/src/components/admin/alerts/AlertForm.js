/**
 * Modal formulaire création/édition d'alerte - Espace Admin
 * Gère son propre état de formulaire (initialisé depuis editingAlert)
 */

import { useState, useEffect } from "react";
import AdminModal, {
  ModalFormGroup,
  ModalInput,
  ModalTextarea,
  ModalSelect,
  ModalActions,
  ModalSubmitButton,
  ModalCancelButton
} from "@/components/admin/AdminModal";
import { TYPE_CONFIG, STYLE_CONFIG } from "./alertConfig";

const INITIAL_FORM = {
  title: "",
  message: "",
  alert_type: "banner",
  style: "info",
  target: "all",
  image_url: "",
  link_url: "",
  link_text: "",
  dismissible: true
};

const AlertForm = ({ isOpen, onClose, editingAlert, onSave }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);

  // Initialiser le formulaire quand l'alerte à modifier change
  useEffect(() => {
    if (editingAlert) {
      setFormData({
        title:      editingAlert.title,
        message:    editingAlert.message,
        alert_type: editingAlert.alert_type,
        style:      editingAlert.style,
        target:     editingAlert.target,
        image_url:  editingAlert.image_url || "",
        link_url:   editingAlert.link_url  || "",
        link_text:  editingAlert.link_text || "",
        dismissible: editingAlert.dismissible
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [editingAlert, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await onSave({
        ...formData,
        image_url: formData.image_url || null,
        link_url:  formData.link_url  || null,
        link_text: formData.link_text || null
      });
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setFormLoading(false);
    }
  };

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAlert ? "Modifier l'alerte" : "Nouvelle alerte"}
    >
      <form onSubmit={handleSubmit}>
        <ModalFormGroup label="Titre" required>
          <ModalInput
            type="text"
            value={formData.title}
            onChange={set('title')}
            required
            maxLength={100}
            placeholder="Ex: Maintenance prévue"
          />
        </ModalFormGroup>

        <ModalFormGroup label="Message" required>
          <ModalTextarea
            value={formData.message}
            onChange={set('message')}
            required
            rows={3}
            maxLength={500}
            placeholder="Rédigez le message de l'alerte..."
          />
        </ModalFormGroup>

        <ModalFormGroup label="Type d'alerte" required>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = formData.alert_type === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, alert_type: key })}
                  className="p-3 rounded-lg border transition-colors flex items-center justify-center gap-2"
                  style={{
                    borderColor: isSelected ? "var(--admin-accent)" : "var(--admin-border)",
                    background: isSelected ? "rgba(233, 69, 96, 0.2)" : "var(--admin-bg-section)"
                  }}
                >
                  <Icon size={18} style={{ color: isSelected ? "var(--admin-text)" : "var(--admin-text-secondary)" }} />
                  <span style={{ color: isSelected ? "var(--admin-text)" : "var(--admin-text-secondary)" }}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </ModalFormGroup>

        <ModalFormGroup label="Style visuel" required>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(STYLE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = formData.style === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, style: key })}
                  className="p-3 rounded-lg border transition-colors flex flex-col items-center gap-2"
                  style={{
                    borderColor: isSelected ? "var(--admin-accent)" : "var(--admin-border)",
                    background: isSelected ? "rgba(233, 69, 96, 0.2)" : "var(--admin-bg-section)"
                  }}
                >
                  <Icon size={20} style={{ color: config.color }} />
                  <span
                    className="text-xs"
                    style={{ color: isSelected ? "var(--admin-text)" : "var(--admin-text-secondary)" }}
                  >
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </ModalFormGroup>

        <ModalFormGroup label="Destinataires" required>
          <ModalSelect
            value={formData.target}
            onChange={set('target')}
            required
          >
            <option value="all">Tous les membres</option>
            <option value="developer">Développeurs uniquement</option>
            <option value="commercial">Commerciaux uniquement</option>
            <option value="public">Site public (visiteurs)</option>
          </ModalSelect>
        </ModalFormGroup>

        <ModalFormGroup label="URL de l'image (optionnel)">
          <ModalInput
            type="url"
            value={formData.image_url}
            onChange={set('image_url')}
            placeholder="https://exemple.com/image.jpg"
          />
          {formData.image_url && (
            <div
              className="mt-2 p-2 rounded-lg"
              style={{ background: "var(--admin-bg-section)", border: "1px solid var(--admin-border)" }}
            >
              <img
                src={formData.image_url}
                alt="Aperçu"
                className="max-h-32 rounded mx-auto"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
        </ModalFormGroup>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <ModalFormGroup label="URL du lien (optionnel)">
            <ModalInput
              type="url"
              value={formData.link_url}
              onChange={set('link_url')}
              placeholder="https://..."
            />
          </ModalFormGroup>
          <ModalFormGroup label="Texte du lien (optionnel)">
            <ModalInput
              type="text"
              value={formData.link_text}
              onChange={set('link_text')}
              placeholder="En savoir plus"
            />
          </ModalFormGroup>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.dismissible}
              onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
              className="w-5 h-5 rounded"
              style={{ accentColor: "var(--admin-accent)" }}
            />
            <span style={{ color: "var(--admin-text-secondary)" }}>
              L'utilisateur peut fermer cette alerte
            </span>
          </label>
        </div>

        <ModalActions>
          <ModalSubmitButton loading={formLoading}>
            {editingAlert ? "Mettre à jour" : "Créer l'alerte"}
          </ModalSubmitButton>
          <ModalCancelButton onClick={onClose} />
        </ModalActions>
      </form>
    </AdminModal>
  );
};

export default AlertForm;
