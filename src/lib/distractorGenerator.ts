export function generateDistractors(answer: string): string[] {

  const a = answer.trim()

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ]

  const durations = [
    "1 month","2 months","3 months","6 months","12 months"
  ]

  // YEAR
  if (/^\d{4}$/.test(a)) {
    const year = parseInt(a)

    return [
      String(year - 1),
      String(year + 1),
      String(year + 5)
    ]
  }

  // NUMBER
  if (/^\d+$/.test(a)) {
    const num = parseInt(a)

    return [
      String(num - 1),
      String(num + 1),
      String(num + 2)
    ]
  }

  // PERCENT
  if (/^\d+%$/.test(a)) {
    const num = parseInt(a)

    return [
      `${num-5}%`,
      `${num+5}%`,
      `${num+10}%`
    ]
  }

  // MONTH
  if (months.includes(a)) {

    const others = months.filter(m => m !== a)

    shuffleArray(others)

    return others.slice(0,3)
  }

  // MONTH DURATION
  if (a.toLowerCase().includes("month")) {

    const others = durations.filter(d => d !== a)

    return others.slice(0,3)
  }

  // DAY + MONTH (example February 28)
  if (/\w+\s\d{1,2}/.test(a)) {

    return [
      "January 1",
      "March 15",
      "December 31"
    ]
  }

  // PERSON NAME
  if (a.split(" ").length >= 2 && /^[A-Z]/.test(a)) {

    return [
      "Mahatma Gandhi",
      "Jawaharlal Nehru",
      "Subhash Chandra Bose"
    ].filter(x => x !== a).slice(0,3)
  }

  // COUNTRY
  const countries = [
    "India","Pakistan","China","Japan",
    "France","Germany","Brazil","Canada"
  ]

  if (countries.includes(a)) {

    return countries.filter(c => c !== a).slice(0,3)
  }

  // BANK / INSTITUTION
  if (a.toLowerCase().includes("bank")) {

    return [
      "State Bank of India",
      "Punjab National Bank",
      "Bank of Baroda"
    ].filter(x => x !== a).slice(0,3)
  }

  // DEFAULT
  return [
    "Option A",
    "Option B",
    "Option C"
  ]
}

function shuffleArray<T>(arr:T[]):T[]{

  for(let i=arr.length-1;i>0;i--){

    const j=Math.floor(Math.random()*(i+1))

    ;[arr[i],arr[j]]=[arr[j],arr[i]]
  }

  return arr
}