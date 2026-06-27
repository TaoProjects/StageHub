import React, { useState } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';

const GigDashboard: React.FC = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [cacheOffer, setCacheOffer] = useState('');
  const [repertoireLink, setRepertoireLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Supabase insert code here
    toast.success('Gig salva com sucesso! ID #1 gerado.');
    setModalIsOpen(false);
    setTitle('');
    setSpecialtyId(null);
    setCityId(null);
    setEventDate('');
    setCacheOffer('');
    setRepertoireLink('');
  };

  return (
    <div className="bg-gray-200 p-4">
      <header>
        <h1 className="text-xl font-bold">StageHub | Área do Organizador</h1>
        <button
          onClick={() => setModalIsOpen(true)}
          className="bg-blue-500 text-white px-3 py-2 rounded"
        >
          + Criar Nova Gig
        </button>
      </header>
      <div className="mt-4">
        <nav className="flex space-x-4">
          <button className="border-b-2 border-blue-500">Minhas Gigs (Como Organizador)</button>
          <button>Convites Recebidos (Como Sideman)</button>
        </nav>
      </div>
      <div className="mt-8 text-center" hidden={true}>
        Você ainda não cadastrou nenhum show. Crie sua primeira Gig acima!
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Create Gig Modal"
        className="bg-white p-4 rounded shadow-lg w-full max-w-md mx-auto"
      >
        <h2 className="text-xl font-bold">Criar Nova Gig</h2>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-3">
            <label htmlFor="title" className="block mb-1">
              Título do Evento
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="specialty" className="block mb-1">
              Especialidade
            </label>
            <select
              id="specialty"
              value={specialtyId}
              onChange={(e) => setSpecialtyId(Number(e.target.value))}
              required
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Selecione...</option>
              <option value="1">Baile</option>
              <option value="2">Igreja</option>
              <option value="3">Casamento</option>
              <option value="4">Barzinho</option>
              <option value="5">Sideman</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="city" className="block mb-1">
              Cidade
            </label>
            <input
              type="text"
              id="city"
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="Digite o nome da cidade"
              onChange={(e) => {
                // Fetch city ID from IBGE API here
              }}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="eventDate" className="block mb-1">
              Data e Hora
            </label>
            <input
              type="datetime-local"
              id="eventDate"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="cacheOffer" className="block mb-1">
              Cachê Oferecido (R$)
            </label>
            <input
              type="text"
              id="cacheOffer"
              value={cacheOffer}
              onChange={(e) => setCacheOffer(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="repertoireLink" className="block mb-1">
              Link de Repertório
            </label>
            <input
              type="text"
              id="repertoireLink"
              value={repertoireLink}
              onChange={(e) => setRepertoireLink(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => setModalIsOpen(false)}
              className="bg-gray-300 text-white px-3 py-2 rounded mr-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-3 py-2 rounded"
            >
              Salvar Gig
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GigDashboard;