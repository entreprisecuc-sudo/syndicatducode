/**
 * Modal de configuration Stripe — Admin Subscriptions
 */

import AdminModal, {
  ModalFormGroup,
  ModalInput,
  ModalActions,
  ModalCancelButton
} from "@/components/admin/AdminModal";

const StripeConfigModal = ({ isOpen, onClose, stripeForm, setStripeForm, onSubmit, loading }) => (
  <AdminModal
    isOpen={isOpen}
    onClose={onClose}
    title="Configuration Stripe"
    maxWidth="max-w-lg"
  >
    <p style={{ color: "var(--admin-text-secondary)" }} className="text-sm mb-6">
      Entrez vos clés Stripe pour activer les paiements.{" "}
      <a
        href="https://dashboard.stripe.com/apikeys"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:underline"
      >
        Obtenir les clés →
      </a>
    </p>

    <form onSubmit={onSubmit}>
      <ModalFormGroup label="Clé publique (pk_...)">
        <ModalInput
          type="text"
          value={stripeForm.stripe_public_key}
          onChange={(e) => setStripeForm({ ...stripeForm, stripe_public_key: e.target.value })}
          placeholder="pk_test_..."
        />
      </ModalFormGroup>

      <ModalFormGroup label="Clé secrète (sk_...)">
        <ModalInput
          type="password"
          value={stripeForm.stripe_secret_key}
          onChange={(e) => setStripeForm({ ...stripeForm, stripe_secret_key: e.target.value })}
          placeholder="sk_test_..."
        />
      </ModalFormGroup>

      <ModalFormGroup label="Webhook secret (whsec_...)">
        <ModalInput
          type="password"
          value={stripeForm.stripe_webhook_secret}
          onChange={(e) => setStripeForm({ ...stripeForm, stripe_webhook_secret: e.target.value })}
          placeholder="whsec_..."
        />
      </ModalFormGroup>

      <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={stripeForm.is_live_mode}
            onChange={(e) => setStripeForm({ ...stripeForm, is_live_mode: e.target.checked })}
            className="w-5 h-5 rounded"
            style={{ accentColor: "var(--admin-accent)" }}
          />
          <span style={{ color: "var(--admin-text-secondary)" }}>
            Mode Production (clés live)
          </span>
        </label>
      </div>

      <div
        className="p-3 rounded-lg mb-4"
        style={{
          background: "rgba(245, 158, 11, 0.1)",
          border: "1px solid rgba(245, 158, 11, 0.3)"
        }}
      >
        <p className="text-yellow-400 text-sm">
          En mode test, aucun paiement réel ne sera effectué.
        </p>
      </div>

      <ModalActions>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
        <ModalCancelButton onClick={onClose} />
      </ModalActions>
    </form>
  </AdminModal>
);

export default StripeConfigModal;
