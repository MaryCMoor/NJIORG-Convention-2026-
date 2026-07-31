import { Images, Landmark, UserRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './AppArea.css'

const NJAssemblies = () => {
  const { sheetData } = useApp()
  const assemblies = sheetData.assemblies || []

  return (
    <div className="app-area-page nj-assemblies-page">
      <section className="app-area-hero compact-hero">
        <span className="area-icon"><Landmark size={34} /></span>
        <p className="area-kicker">New Jersey Rainbow</p>
        <h1>NJ Assemblies</h1>
        <p>Meet the local assemblies, Mother Advisors, term themes, and photo galleries.</p>
      </section>

      {assemblies.length === 0 ? (
        <section className="area-info-card">
          <h2><Landmark size={22} /> Assemblies</h2>
          <p>No assemblies have been added yet.</p>
        </section>
      ) : (
        <section className="assemblies-grid" aria-label="New Jersey Assemblies">
          {assemblies.map(assembly => (
            <article key={assembly.assemblyId || assembly.id || assembly.assemblyName} className="assembly-card">
              <div className="assembly-card-icon"><Landmark size={26} /></div>
              <div className="assembly-card-content">
                <h2>{assembly.assemblyName || assembly.name}</h2>
                {assembly.motherAdvisor && (
                  <p className="assembly-meta"><UserRound size={16} /> Mother Advisor: {assembly.motherAdvisor}</p>
                )}
                {assembly.termTheme && (
                  <p className="assembly-theme">Theme: {assembly.termTheme}</p>
                )}
                {assembly.notes && <p>{assembly.notes}</p>}
                {assembly.galleryFolderUrl && (
                  <a className="assembly-gallery-link" href={assembly.galleryFolderUrl} target="_blank" rel="noreferrer">
                    <Images size={16} /> View photo gallery
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

export default NJAssemblies
