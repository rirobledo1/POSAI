                  ))}
                </div>
              </div>

              {/* Campo de efectivo */}
              {paymentMethod === 'EFECTIVO' && (
                <div className="space-y-3">
                  <Label className="text-base md:text-lg font-semibold">Efectivo Recibido</Label>
                  <Input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0.00"
                    className="h-12 md:h-14 text-lg md:text-xl text-center"
                  />
                  {change > 0 && (
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200">
                      <p className="text-center text-green-800 font-bold text-lg md:text-xl">
                        Cambio: {formatCurrency(change)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Totales */}
              <div className="bg-gray-50 p-4 md:p-6 rounded-lg space-y-2 md:space-y-3">
                <div className="flex justify-between text-sm md:text-base">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>IVA ({Math.round(validTaxRate * 100)}%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm md:text-base">
                    <span>Envío</span>
                    <span className="text-blue-600">{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 md:pt-3 border-t border-gray-300 font-bold text-lg md:text-xl">
                  <span>TOTAL</span>
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Botón procesar venta */}
              <Button
                onClick={processSale}
                disabled={!canProcessSale || processingPayment}
                className="w-full h-14 md:h-16 text-lg md:text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all disabled:opacity-50"
              >
                {processingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-2 border-white border-t-transparent"></div>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>💰 Procesar Venta {formatCurrency(total)}</span>
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Modal de selección de cliente TOUCH-OPTIMIZADO */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-4 md:p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl md:text-2xl font-bold">Seleccionar Cliente</h3>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setShowCustomerModal(false)}
                    className="h-10 w-10 md:h-12 md:w-12 p-0 rounded-full"
                  >
                    <X className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </div>
                <Input
                  placeholder="Buscar cliente por nombre, email, teléfono o RFC..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="h-12 md:h-14 text-base md:text-lg"
                />
              </div>
              
              <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="space-y-3">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-4 md:p-6 border-2 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all active:scale-[0.98]"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowCustomerModal(false);
                        setCustomerSearch('');
                        showSuccess('Cliente seleccionado', `${customer.name} ha sido seleccionado para la venta`);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-bold text-lg md:text-xl">{customer.name}</p>
                          {customer.email && (
                            <p className="text-sm md:text-base text-gray-600">{customer.email}</p>
                          )}
                          {customer.phone && (
                            <p className="text-sm md:text-base text-gray-600">{customer.phone}</p>
                          )}
                          {customer.rfc && (
                            <p className="text-xs md:text-sm text-gray-500">RFC: {customer.rfc}</p>
                          )}
                        </div>
                        <div className="text-right text-sm md:text-base">
                          <p className="text-gray-600">Límite: {formatCurrency(customer.creditLimit)}</p>
                          <p className="text-blue-600 font-semibold">Usado: {formatCurrency(customer.currentDebt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-12">
                    <User className="h-16 w-16 md:h-20 md:w-20 text-gray-400 mx-auto mb-4" />
                    {customerSearch ? (
                      <div className="space-y-4">
                        <p className="text-gray-500 text-lg md:text-xl">
                          No se encontró "{customerSearch}"
                        </p>
                        <Button
                          onClick={() => openCreateCustomerModal(customerSearch)}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700 text-white h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
                        >
                          <Plus className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                          Agregar Cliente Nuevo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-500 text-lg md:text-xl">No hay clientes registrados</p>
                        <Button
                          onClick={() => openCreateCustomerModal()}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700 text-white h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
                        >
                          <Plus className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                          Agregar Cliente Nuevo
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de gestión de direcciones */}
        {showAddressModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-4 md:p-6 border-b flex justify-between items-center">
                <h3 className="text-xl md:text-2xl font-bold">
                  Direcciones de {selectedCustomer.name}
                </h3>
                <Button
                  onClick={() => setShowAddressModal(false)}
                  variant="outline"
                  size="lg"
                  className="h-10 w-10 md:h-12 md:w-12 p-0 rounded-full"
                >
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </div>
              <div className="p-4 md:p-6">
                <AddressManager
                  customerId={selectedCustomer.id}
                  addresses={customerAddresses}
                  onAddressAdded={(address) => {
                    setCustomerAddresses(prev => [...prev, address]);
                    setSelectedAddressId(address.id);
                    setShowAddressModal(false);
                  }}
                  onAddressUpdated={(address) => {
                    setCustomerAddresses(prev => 
                      prev.map(addr => addr.id === address.id ? address : addr)
                    );
                  }}
                  onAddressDeleted={(addressId) => {
                    setCustomerAddresses(prev => 
                      prev.filter(addr => addr.id !== addressId)
                    );
                    if (selectedAddressId === addressId) {
                      setSelectedAddressId('');
                    }
                  }}
                  onAddressSelected={(address) => {
                    setSelectedAddressId(address.id);
                    setShowAddressModal(false);
                  }}
                  selectedAddressId={selectedAddressId}
                  showSelector={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}