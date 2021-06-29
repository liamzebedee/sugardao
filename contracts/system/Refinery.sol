contract Refinery {
    struct CollateralSettings {
        address token;
    }

    mapping(address => CollateralSettings) collaterals;
}