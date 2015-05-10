(function($){
    function initializeOrderCalendar(base) {
        ////console.log('Init');
        initializeEvenMasterModel(base);
        initializeAbstractPrice(base);
        initializePrice(base);
        initializeService(base);
        initializeServiceJobTypes(base);
        initializeServicesTypesModel(base);
        initializeServicesCategoryModel(base);
        initializeEvenMasterModel(base);
        initializeCalendarNote(base);
        initializeWorkingNote(base);
        initializeOrderNote(base);
        ////console.log('Init models');
        base.categories =
            new base.CategoriesCollection(_.toArray(base.categories));

        initializeServiceCategoryView(base);
        initializeJobTypesView(base);
        initializeCalendarWidgetView(base);
        initializeCalendarView(base);
        initializeRivetsCalendar(base);
        ////console.log('Init views');
        base.calendar = new base.CalendarView({
            el: $('.calendar_wrapper')[0]
        });
        base.jobTypesView = new base.JobTypesView({
            el: $('.salon-order .job-types')[0]
        });
        base.categoriesView = new base.ServiceCategoriesView({
            el: $('.menu-categories.categories')[0],
            categories: base.categories
        });
        base.calendar.loadNotes();
    }
    $(document).ready(function() {
        ////console.log('Document ready');
        setTimeout(function(){
            ////console.log('Before init');
            initializeOrderCalendar(OrderSystem)
        }, 1);
    });
    ////console.log('Calendar file parsed');
})(jQuery);