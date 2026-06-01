/**
 * Modal de création / édition d'un plan — Admin Subscriptions
 */

import AdminModal, {
  ModalFormGroup,
  ModalInput,
  ModalTextarea,
  ModalActions,
  ModalSubmitButton,
  ModalCancelButton
} from "@/components/admin/AdminModal";

const PlanModal = ({ isOpen, onClose, planForm, setPlanForm, onSubmit, loading, isEditing }) => (
  <AdminModal
    isOpen={isOpen}
    onClose={onClose}
    title={isEditing ? "Modifier le plan" : "Nouveau plan"}
    maxWidth="max-w-lg"
  >
    <form onSubmit={onSubmit}>
      <ModalFormGroup label="Nom du plan" required>
        <ModalInput
          type="text"
          value={planForm.name}
          onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
          required
          placeholder="Ex: Starter, Pro, Premium"
        />
      </ModalFormGroup>

      <ModalFormGroup label="Description" required>
        <ModalTextarea
          value={planForm.description}
          onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
          required
          rows={2}
          placeholder="Description courte du plan"
        />
      </ModalFormGroup>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ModalFormGroup label="Prix mensuel (€)" required>
          <ModalInput
            type="number"
            step="0.01"
            value={planForm.price_monthly}
            onChange={(e) => setPlanForm({ ...planForm, price_monthly: e.target.value })}
            required
          />
        </ModalFormGroup>
        <ModalFormGroup label="Prix annuel (€)" required>
          <ModalInput
            type="number"
            step="0.01"
            value={planForm.price_yearly}
            onChange={(e) => setPlanForm({ ...planForm, price_yearly: e.target.value })}
            required
          />
        </ModalFormGroup>
      </div>

      <ModalFormGroup label="Fonctionnalités (une par ligne)">
        <ModalTextarea
          value={planForm.features}
          onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
          rows={4}
          placeholder={"Accès aux projets\nSupport prioritaire\n..."}
        />
      </ModalFormGroup>

      <ModalFormGroup label="Jours d'essai gratuit">
        <ModalInput
          type="number"
          min="0"
          value={planForm.trial_days}
          onChange={(e) => setPlanForm({ ...planForm, trial_days: e.target.value })}
        />
      </ModalFormGroup>

      <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={planForm.is_recommended}
            onChange={(e) => setPlanForm({ ...planForm, is_recommended: e.target.checked })}
            className="w-5 h-5 rounded"
            style={{ accentColor: "var(--admin-accent)" }}
          />
          <span style={{ color: "var(--admin-text-secondary)" }}>
            Mettre en avant ce plan (recommandé)
          </span>
        </label>
      </div>

      <ModalActions>
        <ModalSubmitButton loading={loading}>
          {isEditing ? "Mettre à jour" : "Créer le plan"}
        </ModalSubmitButton>
        <ModalCancelButton onClick={onClose} />
      </ModalActions>
    </form>
  </AdminModal>
);

export default PlanModal;
