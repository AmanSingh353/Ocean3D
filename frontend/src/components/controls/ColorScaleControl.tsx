import { useState } from 'react'
import { Modal } from '../common/Modal'

interface ColorScaleControlProps {
  min: number
  max: number
  onApply: (min: number, max: number) => void
}

export function ColorScaleControl({ min, max, onApply }: ColorScaleControlProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [draftMin, setDraftMin] = useState(String(min))
  const [draftMax, setDraftMax] = useState(String(max))

  const openModal = () => {
    setDraftMin(String(min))
    setDraftMax(String(max))
    setModalOpen(true)
  }

  const handleApply = () => {
    const newMin = Number(draftMin)
    const newMax = Number(draftMax)
    if (!Number.isNaN(newMin) && !Number.isNaN(newMax) && newMin < newMax) {
      onApply(newMin, newMax)
      setModalOpen(false)
    }
  }

  return (
    <div className="control-block">
      <label className="control-label">TEMPERATURE SCALE</label>
      <div className="color-scale">
        <div className="color-scale__gradient" />
        <div className="color-scale__labels"><span>{min}°C</span><span>{max}°C</span></div>
      </div>
      <button type="button" className="btn btn--ghost" onClick={openModal}>Customize</button>
      <Modal
        open={modalOpen}
        title="Customize Color Scale"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="button" className="btn btn--primary" onClick={handleApply}>Apply</button>
          </>
        }
      >
        <div className="modal-field">
          <label htmlFor="scale-min">Minimum</label>
          <input id="scale-min" type="number" className="text-input" value={draftMin} onChange={(e) => setDraftMin(e.target.value)} />
        </div>
        <div className="modal-field">
          <label htmlFor="scale-max">Maximum</label>
          <input id="scale-max" type="number" className="text-input" value={draftMax} onChange={(e) => setDraftMax(e.target.value)} />
        </div>
        <div className="modal-field">
          <label htmlFor="scale-type">Scale</label>
          <select id="scale-type" className="select-input" defaultValue="linear">
            <option value="linear">Linear</option>
          </select>
        </div>
      </Modal>
    </div>
  )
}
