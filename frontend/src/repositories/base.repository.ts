import axios from 'axios';

export class BaseRepository<T, CreateDto, UpdateDto> {
  constructor(protected baseUrl: string) {}

  async findAll(): Promise<T[]> {
    const response = await axios.get<T[]>(this.baseUrl);
    return response.data;
  }

  async findOne(id: string): Promise<T | null> {
    try {
      const response = await axios.get<T>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(createDto: CreateDto): Promise<T> {
    const response = await axios.post<T>(this.baseUrl, createDto);
    return response.data;
  }

  async update(id: string, updateDto: UpdateDto): Promise<T> {
    const response = await axios.put<T>(`${this.baseUrl}/${id}`, updateDto);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`);
  }

  async findBy(criteria: Partial<T>): Promise<T[]> {
    const response = await axios.get<T[]>(this.baseUrl, { params: criteria });
    return response.data;
  }
}
