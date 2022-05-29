export default function FileInput({ onChange, label, accept }) {
  return (
    <div className='flex flex-col'>
      <label className="block mb-2 text-sm font-medium text-gray-900" htmlFor="file">{label}</label>
      <input className="block mb-5 w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 cursor-pointer focus:outline-none" id="file" type="file" accept={accept} onChange={onChange} />
    </div>
  )
}