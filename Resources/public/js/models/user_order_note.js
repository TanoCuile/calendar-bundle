function initializeUserOrderNote(base){
    var order = {};
    initializeCalendarNote(order);
    initializeOrderNote(order);

    base.OrderNote = order.OrderNote.extend({
        save_url: '/api/calendar/order/user/save'
    });
}