/**
 * Table des abonnés actifs — Admin Subscriptions
 */

const SubscribersList = ({ subscriptions }) => (
  <div
    className="rounded-xl overflow-hidden"
    style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
  >
    <table className="w-full">
      <thead>
        <tr className="border-b border-[#1f4068]">
          <th className="text-left p-4 text-gray-400 font-medium">Utilisateur</th>
          <th className="text-left p-4 text-gray-400 font-medium">Plan</th>
          <th className="text-left p-4 text-gray-400 font-medium">Prix</th>
          <th className="text-left p-4 text-gray-400 font-medium">Statut</th>
          <th className="text-left p-4 text-gray-400 font-medium">Échéance</th>
        </tr>
      </thead>
      <tbody>
        {subscriptions.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center p-8 text-gray-400">
              Aucun abonnement
            </td>
          </tr>
        ) : subscriptions.map(sub => (
          <tr key={sub.id} className="border-b border-[#1f4068]/50">
            <td className="p-4 text-white">{sub.user_email}</td>
            <td className="p-4 text-gray-300">{sub.plan_name}</td>
            <td className="p-4 text-gray-300">
              {sub.price}€/{sub.duration === "monthly" ? "mois" : "an"}
            </td>
            <td className="p-4">
              <span className={`px-2 py-1 rounded text-xs ${
                sub.status === "active" ? "bg-green-500/20 text-green-400" :
                sub.status === "expired" ? "bg-red-500/20 text-red-400" :
                "bg-gray-500/20 text-gray-400"
              }`}>
                {sub.status}
              </span>
            </td>
            <td className="p-4 text-gray-400 text-sm">
              {new Date(sub.end_date).toLocaleDateString("fr-FR")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SubscribersList;
