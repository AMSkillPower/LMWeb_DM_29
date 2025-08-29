import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Calendar,
  Users,
  Package,
  Building,
  Download,
  Filter,
  BarChart3,
  PieChart,
  ExternalLink,
} from "lucide-react";
import {
  formatDate,
  getStatoColor,
  getStatoText,
  formatCurrency,
} from "../utils/licenseUtils";
import { FilterScadenza } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts";
import toast from "react-hot-toast";

const Dashboard: React.FC = () => {
  const { state, getClienteById, getSoftwareById } = useApp();
  const [filterScadenza, setFilterScadenza] =
    useState<FilterScadenza>("1month");
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh when data changes
  useEffect(() => {
    const handleDataUpdate = () => {
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("dataUpdated", handleDataUpdate);
    return () => window.removeEventListener("dataUpdated", handleDataUpdate);
  }, []);

  // Recalculate data when state changes
  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [state.licenze, state.clienti, state.software, state.stats]);

  const getFilteredLicenzeInScadenza = () => {
    const oggi = new Date();
    let dataLimite = new Date();

    switch (filterScadenza) {
      case "1month":
        dataLimite.setMonth(oggi.getMonth() + 1);
        break;
      case "3months":
        dataLimite.setMonth(oggi.getMonth() + 3);
        break;
      case "6months":
        dataLimite.setMonth(oggi.getMonth() + 6);
        break;
      case "1year":
        dataLimite.setFullYear(oggi.getFullYear() + 1);
        break;
      default:
        return state.licenze.filter((l) => l.stato === "in_scadenza");
    }

    return state.licenze.filter((l) => {
      const scadenza = new Date(l.dataScadenza);
      return (
        scadenza >= oggi && scadenza <= dataLimite && l.stato !== "scaduta"
      );
    });
  };

  const licenzeInScadenzaFiltrate = getFilteredLicenzeInScadenza();
  const licenzeScaduteRecenti = state.licenze
    .filter((l) => l.stato === "scaduta")
    .slice(0, 5);
  const licenzeAttive = state.licenze
    .filter((l) => l.stato === "valida")
    .slice(0, 10);

  // Dati per grafici
      const softwareStats = state.software
      .map((software) => {
        const excludedSoftware = ["solidworks", "solidworks pdm", "mechworks pdm"];
        if (excludedSoftware.some((excluded) =>
          software.nomeSoftware.toLowerCase().includes(excluded.toLowerCase())
        )) return null;

        const licenzeSoftware = state.licenze.filter((l) => l.softwareId === software.id);
        const totaleLicenze = licenzeSoftware.reduce((acc, l) => acc + l.numeroLicenze, 0);

        return {
          software: software.nomeSoftware,
          licenze: totaleLicenze,
        };
      })
      .filter((item): item is { software: string; licenze: number } => Boolean(item)) // forza TypeScript a capire che non è null
      .sort((a, b) => b.licenze - a.licenze)
      .slice(0, 7);



      // Ricalcola le statistiche in tempo reale
      const currentStats = {
        licenzeTotali: state.licenze.length,
        licenzeValide: state.licenze.filter((l) => l.stato === "valida").length,
        licenzeInScadenza: state.licenze.filter((l) => l.stato === "in_scadenza")
          .length,
        licenzeScadute: state.licenze.filter((l) => l.stato === "scaduta").length,
      };

      const statoDistribution = [
        { name: "Valide", value: currentStats.licenzeValide, color: "#10B981" },
        {
          name: "In Scadenza",
          value: currentStats.licenzeInScadenza,
          color: "#F59E0B",
        },
        { name: "Scadute", value: currentStats.licenzeScadute, color: "#EF4444" },
      ];

  const statCards = [
    {
      title: "Contratti Totali",
      value: currentStats.licenzeTotali,
      icon: FileText,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      link: "licenze",
    },
    {
      title: "Licenze Valide",
      value: currentStats.licenzeValide,
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-600",
      link: "licenze",
    },
    {
      title: "In Scadenza",
      value: currentStats.licenzeInScadenza,
      icon: AlertTriangle,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      link: "licenze",
    },
    {
      title: "Scadute",
      value: currentStats.licenzeScadute,
      icon: XCircle,
      color: "bg-red-500",
      textColor: "text-red-600",
      link: "licenze",
    },
  ];

  const handleCardClick = (link: string) => {
    let searchTerm = "";
    if (link === "licenze") {
      // Determina il filtro basato sulla card cliccata
      let cardElement: Element | null = null;
      const target = event?.target;
      if (target instanceof HTMLElement) {
        cardElement = target.closest("[data-filter]");
      }
      //const cardElement = event?.target?.closest("[data-filter]");
      const filter = cardElement?.getAttribute("data-filter");
      if (filter === "valida") searchTerm = "stato:valida";
      else if (filter === "in_scadenza") searchTerm = "stato:in_scadenza";
      else if (filter === "scaduta") searchTerm = "stato:scaduta";
    }

    if (searchTerm) {
      window.dispatchEvent(
        new CustomEvent("navigateWithSearch", {
          detail: { page: link, searchTerm },
        })
      );
    } else {
      window.dispatchEvent(new CustomEvent("navigate", { detail: link }));
    }
  };

  const handleExportLicenzeAttive = () => {
    const licenzeValide = state.licenze.filter((l) => l.stato === "valida");
    const data = licenzeValide.map((licenza) => {
      const cliente = getClienteById(licenza.clienteId);
      const software = getSoftwareById(licenza.softwareId);
      return {
        "Ragione Sociale": cliente?.ragioneSociale || "",
        Email: cliente?.email || "",
        Telefono: cliente?.telefono || "",
        "Nome Referente": cliente?.nomeReferente || "",
        "Telefono Referente": cliente?.telefonoReferente || "",
        Indirizzo: cliente?.indirizzo || "",
        Comune: cliente?.comune || "",
        CAP: cliente?.cap || "",
        Provincia: cliente?.provincia || "",
        Paese: cliente?.paese || "",
        "Partita IVA": cliente?.partitaIva || "",
        "Codice Fiscale": cliente?.codiceFiscale || "",
        PEC: cliente?.indirizzoPEC || "",
        IBAN: cliente?.iban || "",
        "Email Fatturazione": cliente?.emailFatturazione || "",
        SDI: cliente?.sdi || "",
        "Banca Appoggio": cliente?.bancaAppoggio || "",
        "Sito Web": cliente?.sitoWeb || "",
        Software: software?.nomeSoftware || "",
        "Tipo Licenza": software?.tipoLicenza || "",
        "Codice Software": software?.codice || "",
        "Categoria Software": software?.categoria || "",
        "Descrizione Software": software?.descrizione || "",
        "Costo Unitario": software?.costo ? formatCurrency(software.costo) : "",
        Seriali: licenza.seriali || "",
        "Data Scadenza": formatDate(licenza.dataScadenza),
        "Data Attivazione": formatDate(licenza.dataAttivazione),
        "Data Ordine": licenza.dataOrdine ? formatDate(licenza.dataOrdine) : "",
        "Numero Licenze": licenza.numeroLicenze,
        "Reseller Code": licenza.resellerCode,
        "Riferimento Contratto": licenza.riferimentoContratto || "",
        Note: licenza.note || "",
        Stato: getStatoText(licenza.stato),
      };
    });

    // Importa dinamicamente la funzione di export
    import("../utils/exportUtils")
      .then(({ exportToExcel }) => {
        exportToExcel(data, "Contratti_Attivi", "Contratti Attivi");
      })
      .catch((error) => {
        console.error("Errore nell'esportazione:", error);
        toast.error("Errore durante l'esportazione dei dati");
      });
  };

  const handleExportLicenzeInScadenza = () => {
    const data = licenzeInScadenzaFiltrate.map((licenza) => {
      const cliente = getClienteById(licenza.clienteId);
      const software = getSoftwareById(licenza.softwareId);
      return {
        "Ragione Sociale": cliente?.ragioneSociale || "",
        Email: cliente?.email || "",
        Telefono: cliente?.telefono || "",
        "Nome Referente": cliente?.nomeReferente || "",
        "Telefono Referente": cliente?.telefonoReferente || "",
        Indirizzo: cliente?.indirizzo || "",
        Comune: cliente?.comune || "",
        CAP: cliente?.cap || "",
        Provincia: cliente?.provincia || "",
        Paese: cliente?.paese || "",
        "Partita IVA": cliente?.partitaIva || "",
        "Codice Fiscale": cliente?.codiceFiscale || "",
        PEC: cliente?.indirizzoPEC || "",
        IBAN: cliente?.iban || "",
        "Email Fatturazione": cliente?.emailFatturazione || "",
        SDI: cliente?.sdi || "",
        "Banca Appoggio": cliente?.bancaAppoggio || "",
        "Sito Web": cliente?.sitoWeb || "",
        Software: software?.nomeSoftware || "",
        "Tipo Licenza": software?.tipoLicenza || "",
        "Codice Software": software?.codice || "",
        "Categoria Software": software?.categoria || "",
        "Descrizione Software": software?.descrizione || "",
        "Costo Unitario": software?.costo ? formatCurrency(software.costo) : "",
        Seriali: licenza.seriali || "",
        "Data Scadenza": formatDate(licenza.dataScadenza),
        "Data Attivazione": formatDate(licenza.dataAttivazione),
        "Data Ordine": licenza.dataOrdine ? formatDate(licenza.dataOrdine) : "",
        "Numero Licenze": licenza.numeroLicenze,
        "Reseller Code": licenza.resellerCode,
        "Riferimento Contratto": licenza.riferimentoContratto || "",
        Note: licenza.note || "",
        Stato: getStatoText(licenza.stato),
      };
    });

    import("../utils/exportUtils")
      .then(({ exportToExcel }) => {
        exportToExcel(data, "Licenze_In_Scadenza", "Contratti in Scadenza");
      })
      .catch((error) => {
        console.error("Errore nell'esportazione:", error);
        toast.error("Errore durante l'esportazione dei dati");
      });
  };

  const handleExportLicenzeScadute = () => {
    const licenzeScadute = state.licenze.filter((l) => l.stato === "scaduta");
    const data = licenzeScadute.map((licenza) => {
      const cliente = getClienteById(licenza.clienteId);
      const software = getSoftwareById(licenza.softwareId);
      return {
        "Ragione Sociale": cliente?.ragioneSociale || "",
        Email: cliente?.email || "",
        Telefono: cliente?.telefono || "",
        "Nome Referente": cliente?.nomeReferente || "",
        "Telefono Referente": cliente?.telefonoReferente || "",
        Indirizzo: cliente?.indirizzo || "",
        Comune: cliente?.comune || "",
        CAP: cliente?.cap || "",
        Provincia: cliente?.provincia || "",
        Paese: cliente?.paese || "",
        "Partita IVA": cliente?.partitaIva || "",
        "Codice Fiscale": cliente?.codiceFiscale || "",
        PEC: cliente?.indirizzoPEC || "",
        IBAN: cliente?.iban || "",
        "Email Fatturazione": cliente?.emailFatturazione || "",
        SDI: cliente?.sdi || "",
        "Banca Appoggio": cliente?.bancaAppoggio || "",
        "Sito Web": cliente?.sitoWeb || "",
        Software: software?.nomeSoftware || "",
        "Tipo Licenza": software?.tipoLicenza || "",
        "Codice Software": software?.codice || "",
        "Categoria Software": software?.categoria || "",
        "Descrizione Software": software?.descrizione || "",
        "Costo Unitario": software?.costo ? formatCurrency(software.costo) : "",
        Seriali: licenza.seriali || "",
        "Data Scadenza": formatDate(licenza.dataScadenza),
        "Data Attivazione": formatDate(licenza.dataAttivazione),
        "Data Ordine": licenza.dataOrdine ? formatDate(licenza.dataOrdine) : "",
        "Numero Licenze": licenza.numeroLicenze,
        "Reseller Code": licenza.resellerCode
          ? licenza.resellerCode
          : "",
        "Riferimento Contratto": licenza.riferimentoContratto || "",
        Note: licenza.note || "",
        Stato: getStatoText(licenza.stato),
      };
    });

    import("../utils/exportUtils")
      .then(({ exportToExcel }) => {
        exportToExcel(data, "Contratti_Scaduti", "Contratti Scaduti");
      })
      .catch((error) => {
        console.error("Errore nell'esportazione:", error);
        toast.error("Errore durante l'esportazione dei dati");
      });
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Panoramica delle licenze software
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>
              Ultimo aggiornamento: {formatDate(new Date())}{" "}
              {new Date().toLocaleTimeString("it-IT")}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            data-filter={
              card.title === "Licenze Valide"
                ? "valida"
                : card.title === "In Scadenza"
                ? "in_scadenza"
                : card.title === "Scadute"
                ? "scaduta"
                : ""
            }
            onClick={() => handleCardClick(card.link)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-2 lg:mb-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                  {card.value}
                </p>
              </div>
              <div
                className={`${card.color} p-2 lg:p-3 rounded-lg self-end lg:self-auto`}
              >
                <card.icon className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Software più utilizzato */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Software più utilizzato
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
          {softwareStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={softwareStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="software" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="licenze" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center mt-10">
              Nessun dato disponibile
            </p>
          )}
        </div>
        </div>

        {/* Distribuzione stati licenze */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Distribuzione Stati
            </h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statoDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statoDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div
          onClick={() => handleCardClick("clienti")}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Clienti Attivi
            </h3>
            <Building className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-blue-600">
            {state.clienti.length}
          </div>
          <p className="text-xs lg:text-sm text-gray-500 mt-1">
            Aziende registrate
          </p>
        </div>

        <div
          onClick={() => handleCardClick("software")}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Software Gestiti
            </h3>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-green-600">
            {state.software.length}
          </div>
          <p className="text-xs lg:text-sm text-gray-500 mt-1">
            Prodotti software
          </p>
        </div>

        <div
          onClick={() => handleCardClick("licenze")}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Licenze Totali
            </h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-purple-600">
            {state.licenze.reduce((acc, l) => acc + l.numeroLicenze, 0)}
          </div>
          <p className="text-xs lg:text-sm text-gray-500 mt-1">
            Numero totale licenze
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Licenze attive */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Contratti Attivi
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleExportLicenzeAttive}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center space-x-1"
              >
                <Download className="h-3 w-3" />
                <span>Excel</span>
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {state.licenze.filter((l) => l.stato === "valida").length > 0 ? (
              state.licenze
                .filter((l) => l.stato === "valida")
                .slice(0, 10)
                .map((licenza) => {
                  const cliente = getClienteById(licenza.clienteId);
                  const software = getSoftwareById(licenza.softwareId);
                  return (
                    <div
                      key={licenza.id}
                      className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg"
                    >
                      <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm lg:text-base truncate">
                          {software?.nomeSoftware}
                        </p>
                        <p className="text-xs lg:text-sm text-gray-600 truncate">
                          {cliente?.ragioneSociale}
                        </p>
                        <p className="text-xs lg:text-sm text-green-600">
                          Scade il {formatDate(licenza.dataScadenza)}
                        </p>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-gray-500 text-sm">
                Nessuna licenza registrata
              </p>
            )}
          </div>
        </div>

        {/* Contratti in scadenza */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Contratti in Scadenza
            </h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterScadenza}
                onChange={(e) =>
                  setFilterScadenza(e.target.value as FilterScadenza)
                }
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="1month">1 mese</option>
                <option value="3months">3 mesi</option>
                <option value="6months">6 mesi</option>
                <option value="1year">1 anno</option>
              </select>
              <button
                onClick={handleExportLicenzeInScadenza}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center space-x-1"
              >
                <Download className="h-3 w-3" />
                <span>Excel</span>
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {licenzeInScadenzaFiltrate.length > 0 ? (
              licenzeInScadenzaFiltrate.map((licenza) => {
                const cliente = getClienteById(licenza.clienteId);
                const software = getSoftwareById(licenza.softwareId);
                return (
                  <div
                    key={licenza.id}
                    className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg"
                  >
                    <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm lg:text-base truncate">
                        {software?.nomeSoftware}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-600 truncate">
                        {cliente?.ragioneSociale}
                      </p>
                      <p className="text-xs lg:text-sm text-yellow-600">
                        Scade il {formatDate(licenza.dataScadenza)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">
                Nessuna licenza in scadenza
              </p>
            )}
          </div>
        </div>

        {/* Licenze scadute */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Contratti Scaduti
            </h3>
            <button
              onClick={handleExportLicenzeScadute}
              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center space-x-1"
            >
              <Download className="h-3 w-3" />
              <span>Excel</span>
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {licenzeScaduteRecenti.length > 0 ? (
              licenzeScaduteRecenti.map((licenza) => {
                const cliente = getClienteById(licenza.clienteId);
                const software = getSoftwareById(licenza.softwareId);
                return (
                  <div
                    key={licenza.id}
                    className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg"
                  >
                    <XCircle className="h-4 w-4 lg:h-5 lg:w-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm lg:text-base truncate">
                        {software?.nomeSoftware}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-600 truncate">
                        {cliente?.ragioneSociale}
                      </p>
                      <p className="text-xs lg:text-sm text-red-600">
                        Scaduta il {formatDate(licenza.dataScadenza)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">Nessuna licenza scaduta</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
