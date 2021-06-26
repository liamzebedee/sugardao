# For the purposes of this snippet, the healthy range is just a scalar.
# score(7mmol) = 1.
healthy_range = 7

low_bounds = [0,7]
high_bounds = [7,21]
normalized_low_factor = math.dist(low_bounds)
normalized_high_factor = math.dist(high_bounds)

def score(bgl):
	if bgl < healthy_range:
		return math.dist(bgl, healthy_range) / normalized_low_factor
	else:
		return math.dist(bgl, healthy_range) / normalized_high_factor




def collateralisation_ratio(price_collateral, amount_collateral, amount_issued, bgl):
    return (
        (price_collateral * amount_collateral) /
        (score(bgl) * amount_issued)
    )