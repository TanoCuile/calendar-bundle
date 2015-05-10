function initializeBufferView(base) {
    base.BufferView = Backbone.View.extend({
        from: 0,
        height: 0,
        initialize: function(options) {
            this.from = options.start;
            this.height = options.diff;
        },
        render: function() {
            return '<div style="top: ' + this.from + 'px;height:' + this.height + 'px;" class="buffer empty"></div>';
        }
    })
}