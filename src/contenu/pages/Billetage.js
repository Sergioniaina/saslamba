import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/billetage.css";

const Billetage = ({ totalPrice, onClose, onConfirm, selectedFacture, remainingAmount }) => {
    const [manualInput, setManualInput] = useState(0);
    const [billBreakdown, setBillBreakdown] = useState({
        5000: 0,
        2000: 0,
        1000: 0,
        500: 0,
        200: 0,
        100: 0,
    });
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [selectedPaymentType, setSelectedPaymentType] = useState(""); 
    const [newPaymentType, setNewPaymentType] = useState(""); 
    const [caisses, setCaisses] = useState([]);
    const [selectedCaisse, setSelectedCaisse] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPaymentTypes = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/payement/pay");
                setPaymentTypes(response.data);

                const especePaymentType = response.data.find((type) => type.type === "Espèce");
                if (especePaymentType) {
                    setSelectedPaymentType(especePaymentType._id);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des types de paiement:", error);
            }
        };

        const fetchCaisses = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/caisses");
                setCaisses(response.data);
                if (response.data.length > 0) {
                    setSelectedCaisse(response.data[0]._id);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des caisses:", error);
            }
        };

        fetchPaymentTypes();
        fetchCaisses();
    }, []);

    remainingAmount = totalPrice - manualInput;
    const changeToGive = manualInput - totalPrice > 0 ? manualInput - totalPrice : 0;

    const handleBillClick = (billValue) => {
        setBillBreakdown((prevBreakdown) => ({
            ...prevBreakdown,
            [billValue]: prevBreakdown[billValue] + 1,
        }));
        setManualInput((prevCash) => prevCash + parseInt(billValue));
    };

    const handleManualInputChange = (e) => {
        const value = parseInt(e.target.value, 10) || 0;
        setManualInput(value);
    };

    const handlePaymentTypeChange = (e) => {
        const value = e.target.value;
        setSelectedPaymentType(value);
        if (value !== "autre") {
            setNewPaymentType("");
        }
    };

    const handleConfirm = async () => {
        // Vérification de selectedFacture avant d'accéder à _id
        if (!selectedFacture || !selectedFacture._id) {
            alert("Erreur : Facture non trouvée. Veuillez réessayer.");
            return;
        }

        try {
            const paymentTypeToSubmit =
                selectedPaymentType === "autre" ? newPaymentType : selectedPaymentType;

            await axios.post("http://localhost:5000/api/payement", {
                type: paymentTypeToSubmit,
              //  facture: selectedFacture._id,
            });

            if (remainingAmount === 0) {
                await axios.put(
                    `http://localhost:5000/api/factures/${selectedFacture._id}/etat`,
                    { estPaye: true }
                );
            }

            const caisse = caisses.find((caisse) => caisse._id === selectedCaisse);
            if (caisse) {
                if (!caisse.ouvert) {
                    setError("La caisse est fermée. Vous devez d'abord ouvrir cette caisse.");
                    return;
                }
                await axios.put(
                    `http://localhost:5000/api/caisses/${selectedCaisse}/update-solde`,
                    {
                        solde: caisse.solde + totalPrice,
                    }
                );
            }

            onConfirm({ cashReceived: manualInput, billBreakdown, remainingAmount });
        } catch (error) {
            console.error("Erreur lors de la confirmation du paiement:", error);
            alert("Erreur lors du traitement du paiement. Veuillez réessayer.");
        }
    };

    return (
        <div className="billetage" onClick={onClose}>
            <div className="billetage-content" onClick={(e) => e.stopPropagation()}>
                <div className="close">
                    <button onClick={onClose}>❌</button>
                </div>

                <h2 className="billetage-title">Billetage</h2>

                <div className="input-container">
                    <label>Total à payer :</label>
                    <input
                        type="number"
                        value={totalPrice}
                        readOnly
                        className="input-totalPrice"
                    />
                </div>

                <div>
                    <label>Caisse :</label>
                    <select
                        className="caisse-select"
                        value={selectedCaisse || ""}
                        onChange={(e) => setSelectedCaisse(e.target.value)}
                    >
                        {caisses.map((caisse) => (
                            <option key={caisse._id} value={caisse._id}>
                                {caisse.nom}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Type de paiement :</label>
                    <select
                        value={selectedPaymentType || ""}
                        onChange={handlePaymentTypeChange}
                    >
                        <option value="" disabled>
                            Sélectionnez un type de paiement
                        </option>
                        {paymentTypes.map((type) => (
                            <option key={type._id} value={type._id}>
                                {type.name}
                            </option>
                        ))}
                        <option value="autre">Autre</option>
                    </select>
                    {selectedPaymentType === "autre" && (
                        <input
                            type="text"
                            placeholder="Entrez un nouveau type de paiement"
                            onChange={(e) => setNewPaymentType(e.target.value)}
                            value={newPaymentType}
                        />
                    )}
                </div>

                {selectedCaisse && (
                    <div className="billets-container">
                        <h4>Saisir les billets :</h4>
                        <div className="bill-buttons-container">
                            {Object.keys(billBreakdown).map((billValue) => (
                                <button
                                    key={billValue}
                                    className="bill-button"
                                    onClick={() => handleBillClick(billValue)}
                                >
                                    {billValue} Ar
                                </button>
                            ))}
                        </div>

                        <h4>Saisir le montant total reçu :</h4>
                        <input
                            type="number"
                            value={manualInput}
                            onChange={handleManualInputChange}
                            className="input-manual"
                            placeholder="Entrez le montant"
                        />

                        <div className="summary-container">
                            <h4>Total espèces reçues : {manualInput} Ar</h4>
                            <h4>
                                Reste à payer : {remainingAmount > 0 ? remainingAmount : 0} Ar
                            </h4>
                            <h4>À rendre : {changeToGive} Ar</h4>
                        </div>
                    </div>
                )}

                <div className="billetage-confirm">
                    <button onClick={handleConfirm}>Confirmer</button>
                </div>

                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
};

export default Billetage;
