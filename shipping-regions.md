# Shipping Regions & Country Lists

## Region 1: Malaysia
**Price:** $5.10 | **Delivery:** 11–17 days
- `MY` (Malaysia)

## Region 2: Singapore
**Price:** $12.70 | **Delivery:** 11–15 days
- `SG` (Singapore)

## Region 3: Southeast Asia
**Price:** $22.90 | **Delivery:** 12–18 days
- `TH` (Thailand)
- `ID` (Indonesia)
- `PH` (Philippines)
- `VN` (Vietnam)
- `KH` (Cambodia)
- `LA` (Laos)
- `MM` (Myanmar)
- `BN` (Brunei)
- `TL` (Timor‑Leste)

## Region 4: East Asia
**Price:** $28.00 | **Delivery:** 12–20 days
- `CN` (China)
- `JP` (Japan)
- `KR` (South Korea)
- `TW` (Taiwan)
- `HK` (Hong Kong)
- `MO` (Macau)
- `MN` (Mongolia)

## Region 5: Australia / New Zealand
**Price:** $38.20 | **Delivery:** 13–22 days
- `AU` (Australia)
- `NZ` (New Zealand)

## Region 6: Europe / United Kingdom
**Price:** $56.00 | **Delivery:** 13–24 days
- `GB` (United Kingdom)
- `IE` (Ireland)
- `FR` (France)
- `DE` (Germany)
- `ES` (Spain)
- `IT` (Italy)
- `NL` (Netherlands)
- `BE` (Belgium)
- `LU` (Luxembourg)
- `DK` (Denmark)
- `SE` (Sweden)
- `FI` (Finland)
- `NO` (Norway)
- `IS` (Iceland)
- `CH` (Switzerland)
- `AT` (Austria)
- `PT` (Portugal)
- `GR` (Greece)
- `PL` (Poland)
- `CZ` (Czech Republic)
- `HU` (Hungary)
- `SK` (Slovakia)
- `SI` (Slovenia)
- `HR` (Croatia)
- `RO` (Romania)
- `BG` (Bulgaria)
- `EE` (Estonia)
- `LV` (Latvia)
- `LT` (Lithuania)
- `MT` (Malta)
- `CY` (Cyprus)

## Region 7: USA / Canada
**Price:** $66.20 | **Delivery:** 13–25 days
- `US` (United States)
- `CA` (Canada)

## Combined Allowed Countries List
`MY,SG,TH,ID,PH,VN,KH,LA,MM,BN,TL,CN,JP,KR,TW,HK,MO,MN,AU,NZ,GB,IE,FR,DE,ES,IT,NL,BE,LU,DK,SE,FI,NO,IS,CH,AT,PT,GR,PL,CZ,HU,SK,SI,HR,RO,BG,EE,LV,LT,MT,CY,US,CA`

## Environment Variables Template
```env
# Shipping Rate IDs (replace with your actual Stripe shipping‑rate IDs)
SHIPPING_RATE_IDS=shr_malaysia,shr_singapore,shr_seasia,shr_eastasia,shr_au_nz,shr_europe,shr_us_ca

# Allowed Shipping Countries
SHIPPING_ALLOWED_COUNTRIES=MY,SG,TH,ID,PH,VN,KH,LA,MM,BN,TL,CN,JP,KR,TW,HK,MO,MN,AU,NZ,GB,IE,FR,DE,ES,IT,NL,BE,LU,DK,SE,FI,NO,IS,CH,AT,PT,GR,PL,CZ,HU,SK,SI,HR,RO,BG,EE,LV,LT,MT,CY,US,CA
```

## Notes
1. **Order matters:** The `SHIPPING_RATE_IDS` list must correspond to the regions in the order shown above (Malaysia first, Singapore second, etc.).
2. **Stripe configuration:** Each shipping rate in Stripe must be restricted to the exact country list for its region.
3. **Delivery estimates:** Set the delivery estimate in Stripe for each rate (11–17 days for Malaysia, etc.).
4. **Testing:** Use Stripe test mode with addresses from each region to verify the correct rate appears.
5. **Fallback:** If a customer's country isn't in the allowed list, Stripe will show an error; you can expand the list as needed.