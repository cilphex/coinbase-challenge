// main.js


$(function() {

	var Challenge = {
	
		depth: {
			url: 'https://data.mtgox.com/api/1/BTCUSD/depth/fetch',
			ping_time: 60000,
			interval: null,
			data: null,
			test: 3
		},

		trade: {
			sell: null,
			buy: null,
		},

		service: {
			commission: 0.01
		},

		initialize: function() {
			this.setupListeners();
			this.depth.interval = setInterval(this.getDepth.bind(this), this.depth.ping_time)
			this.getDepth();
		},

		setupListeners: function() {
			$('#sell_input').keyup(this.tradeKeyup.bind(this, 'sell'));
			$('#buy_input').keyup(this.tradeKeyup.bind(this, 'buy'));
		},

		// Fired when the price in the buy or sell update is changed
		tradeKeyup: function(type, e) {
			try {
				var val = parseFloat($(e.target).val());
			}
			catch(e) {
				console.log('error parsing', val, 'into a number');
			}
			if (isNaN(val) || val <= 0) {
				console.log('Negative, zero, or NaN:', val);
				$('#sell_info').hide();
				return;
			}
			this.trade[type] = val;
			this['calculate_' + type]();
		},

		// I'm sure this and calculate_buy could be abstracted into one function
		calculate_sell: function() {
			var bids = this.depth.data.bids;
			var sell_amount = this.trade.sell;
			var total_price = null;
			var trade_kind = $('input[name="sell_kind"]:checked').attr('data-type')

			for (var i = 0; i < bids.length; i++) {
				var bid = bids[i];
				if (sell_amount < bid.sum) {
					if (i > 0) {
						var price_sum = bids[i-1].price_sum;
						var remainder = sell_amount - bids[i-1].sum;
						var additional_price = remainder * bid.price;
						total_price = price_sum + additional_price;
					}
					else {
						total_price = sell_amount * bid.price;
					}
					break;
				}
			}

			if (total_price) {
				var fee = this.service.commission * total_price;
				var final_price = total_price - fee;
				$('#sell_amount').html('$' + total_price);
				$('#sell_fee').html('$' + fee);
				$('#sell_final').html('$' + final_price);
				$('#sell_info').show();
				$('#sell_problem').hide();
				console.log('total price!')
			}
			else {
				$('#sell_info').hide();
				$('#sell_problem').show();
			}
		},

		calculate_buy: function() {
			var asks = this.depth.data.asks;
			var buy_amount = this.trade.buy;
			var total_price = null;
			var trade_kind = $('input[name="buy_kind"]:checked').attr('data-type')

			for (var i = 0; i < asks.length; i++) {
				var ask = asks[i];
				if (buy_amount < ask.sum) {
					if (i > 0) {
						var price_sum = asks[i-1].price_sum;
						var remainder = buy_amount - asks[i-1].sum;
						var additional_price = remainder * ask.price;
						total_price = price_sum + additional_price;
					}
					else {
						total_price = buy_amount * ask.price;
					}
					break;
				}
			}

			if (total_price) {
				var fee = this.service.commission * total_price;
				var final_price = total_price + fee;
				$('#buy_amount').html('$' + total_price);
				$('#buy_fee').html('$' + fee);
				$('#buy_final').html('$' + final_price);
				$('#buy_info').show();
				$('#buy_problem').hide();
			}
			else {
				$('#buy_info').hide();
				$('#buy_problem').show();
			}
		},

		getDepth: function() {
			$.ajax({
				url:     this.depth.url,
				success: this.getDepth_success.bind(this),
				error:   this.getDepth_failure.bind(this)
			});
		},

		getDepth_success: function(data) {
			console.log('depth data', data);
			if (data.result && data.result == 'success') {
				this.depth.data = data.return;
				this.depth.data.bids.reverse();
				window.data = this.depth.data; // testing
				this.updateBids();
			}
			else {
				this.getDepth_failure();
			}
		},

		getDepth_failure: function(data) {
			console.log('depth data: failed');
		},

		updateBids: function() {
			var bids = this.depth.data.bids;
			var asks = this.depth.data.asks;

			// Set current bid and asks prices
			$('#current_bid').html('$' + bids[0].price);
			$('#current_ask').html('$' + asks[0].price);

			// Clear bid and ask lists
			$('#bid_list, #ask_list').html(' ');

			// Fill bid list
			for (var i = 0, bid_sum = 0, price_sum = 0; bid = bids[i]; i++) {
				bid_sum += bid.amount;
				bid.sum = bid_sum;
				price_sum += bid.price * bid.amount;
				bid.price_sum = price_sum;
				var el = [
					'<div class="row clearfix">',
						'<span>' + bid.sum + '</span>',
						'<span>' + bid.amount + '</span>',
						'<span>$' + bid.price + '</span>',
						'<span>$' + bid.price_sum + '</span>',
						//'<p>amount: ' + bid.amount + ', price: ' + bid.price + '</p>',
					'</div>'
				];
				$('#bid_list').append(el.join(''));
			}

			// Fill ask list
			for (var i = 0, ask_sum = 0, price_sum = 0; ask = asks[i]; i++) {
				ask_sum += ask.amount;
				ask.sum = ask_sum;
				price_sum += ask.price * ask.amount;
				ask.price_sum = price_sum;
				var el = [
					'<div class="row clearfix">',
						'<span>' + ask.sum + '</span>',
						'<span>' + ask.amount + '</span>',
						'<span>$' + ask.price + '</span>',
						'<span>$' + ask.price_sum + '</span>',
						//'<p>amount: ' + ask.amount + ', price: ' + ask.price + '</p>',
					'</div>'
				];
				$('#ask_list').append(el.join(''));
			}
		}
	};

	Challenge.initialize();

});