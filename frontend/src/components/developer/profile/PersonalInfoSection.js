/**
 * Section Informations Personnelles - Espace Développeur
 * Inclut : prénom, nom, pseudo, affichage, téléphone, ville, bio
 */

const PersonalInfoSection = ({ formData, onChange }) => (
  <div
    className="p-6 rounded-xl mb-6"
    style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
  >
    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
      Informations personnelles
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Prénom
        </label>
        <input
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={onChange}
          placeholder="Votre prénom"
          className="w-full"
          data-testid="profile-firstname"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Nom
        </label>
        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={onChange}
          placeholder="Votre nom"
          className="w-full"
          data-testid="profile-lastname"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Pseudo / Nom d'artiste
        </label>
        <input
          type="text"
          name="pseudo"
          value={formData.pseudo}
          onChange={onChange}
          placeholder="Votre pseudo (optionnel)"
          className="w-full"
          data-testid="profile-pseudo"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Afficher sur "Nos talents"
        </label>
        <select
          name="display_name_choice"
          value={formData.display_name_choice}
          onChange={onChange}
          className="w-full"
          data-testid="profile-display-choice"
        >
          <option value="name">Mon prénom et nom</option>
          <option value="pseudo">Mon pseudo</option>
          <option value="company">Mon entreprise</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Téléphone
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="06 00 00 00 00"
          className="w-full"
          data-testid="profile-phone"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Ville
        </label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={onChange}
          placeholder="Votre ville"
          className="w-full"
          data-testid="profile-city"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        Bio / Présentation
      </label>
      <textarea
        name="bio"
        value={formData.bio}
        onChange={onChange}
        rows={3}
        placeholder="Présentez-vous en quelques mots..."
        className="w-full"
        data-testid="profile-bio"
      />
    </div>
  </div>
);

export default PersonalInfoSection;
